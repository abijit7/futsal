package com.futsal.service;

import com.futsal.model.Booking;
import com.futsal.model.PaymentTransaction;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.model.enums.PaymentStatus;
import com.futsal.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * The expired-hold decision table.
 *
 * <p>This is the money-safety boundary. The sweep used to cancel every expired hold outright, so a
 * customer who paid and then closed the tab lost both the booking and the money. The rule now is
 * that a hold is released only when eSewa states positively that no money was taken; anything
 * ambiguous keeps its hold for a human to resolve.
 */
class PaymentReconciliationTest {

    private static final long TX_ID = 501L;
    private static final String UUID = "FUTSAL-ABC123";
    private static final String STATUS_URL = "https://rc.esewa.com.np/api/epay/transaction/status/";

    private PaymentTransactionRepository transactionRepository;
    private BookingService bookingService;
    private MockRestServiceServer gateway;
    private PaymentGatewayService service;
    private PaymentTransaction transaction;

    /** succeed() stamps completedAt, so the service needs a real clock. */
    private final Clock clock = Clock.fixed(Instant.parse("2026-06-15T15:00:00Z"), ZoneId.of("UTC"));

    @BeforeEach
    void setUp() {
        transactionRepository = mock(PaymentTransactionRepository.class);
        bookingService = mock(BookingService.class);

        RestClient.Builder builder = RestClient.builder();
        gateway = MockRestServiceServer.bindTo(builder).build();

        service = new PaymentGatewayService(
                transactionRepository, null, bookingService, null, clock, null, null, null, builder.build());
        ReflectionTestUtils.setField(service, "esewaMerchantCode", "EPAYTEST");
        ReflectionTestUtils.setField(service, "esewaStatusUrl", STATUS_URL);
        ReflectionTestUtils.setField(service, "holdMinutes", 60);

        Booking booking = new Booking();
        booking.setBookingId(77L);

        transaction = new PaymentTransaction();
        transaction.setTransactionId(TX_ID);
        transaction.setStatus(PaymentStatus.PENDING);
        transaction.setPaymentMethod(PaymentMethod.ESEWA);
        transaction.setIdempotencyKey(UUID);
        transaction.setAmount(new BigDecimal("1200.00"));
        transaction.setCreatedAt(LocalDateTime.now().minusHours(2));
        transaction.setBooking(booking);

        when(transactionRepository.findByIdForUpdate(TX_ID)).thenReturn(Optional.of(transaction));
        when(bookingService.settleGatewayPayment(anyLong(), anyString())).thenReturn(booking);
    }

    private void gatewayReturns(String json) {
        gateway.expect(requestTo(org.hamcrest.Matchers.startsWith(STATUS_URL)))
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
    }

    /** The case that used to lose money: paid, but the browser never came back. */
    @Test
    void settlesAPaymentEsewaConfirmsAsComplete() {
        gatewayReturns("""
                {"status":"COMPLETE","total_amount":"1200.00","ref_id":"ESW-REF-9931"}""");

        assertEquals(PaymentStatus.COMPLETED, service.reconcileExpiredHold(TX_ID));
        assertEquals(PaymentStatus.COMPLETED, transaction.getStatus());
        assertEquals("ESW-REF-9931", transaction.getGatewayTransactionId());
        verify(bookingService).settleGatewayPayment(77L, "ESW-REF-9931");
        gateway.verify();
    }

    @ParameterizedTest(name = "eSewa says {0} -> hold released")
    @ValueSource(strings = {"NOT_FOUND", "CANCELED", "EXPIRED"})
    void releasesTheHoldWhenEsewaConfirmsNoMoneyWasTaken(String state) {
        gatewayReturns("{\"status\":\"" + state + "\"}");

        assertEquals(PaymentStatus.CANCELLED, service.reconcileExpiredHold(TX_ID));
        assertEquals(PaymentStatus.CANCELLED, transaction.getStatus());
        verify(bookingService, never()).settleGatewayPayment(anyLong(), anyString());
    }

    /**
     * AMBIGUOUS means eSewa itself does not know. Cancelling here is exactly the bug this guards
     * against, so the hold is deliberately kept rather than guessed at.
     */
    @ParameterizedTest(name = "eSewa says {0} -> hold kept for review")
    @ValueSource(strings = {"AMBIGUOUS", "PENDING", "SOMETHING_NEW"})
    void keepsTheHoldWhenEsewaIsNotDefinitive(String state) {
        gatewayReturns("{\"status\":\"" + state + "\"}");

        assertEquals(PaymentStatus.PENDING, service.reconcileExpiredHold(TX_ID));
        assertEquals(PaymentStatus.PENDING, transaction.getStatus(), "the hold must survive");
        verify(bookingService, never()).updateStatus(anyLong(), any(), anyString());
    }

    /** An unreachable gateway is not evidence that the customer did not pay. */
    @Test
    void keepsTheHoldWhenEsewaCannotBeReached() {
        gateway.expect(requestTo(org.hamcrest.Matchers.startsWith(STATUS_URL)))
                .andRespond(withServerError());

        assertEquals(PaymentStatus.PENDING, service.reconcileExpiredHold(TX_ID));
        assertEquals(PaymentStatus.PENDING, transaction.getStatus());
        verify(bookingService, never()).updateStatus(anyLong(), any(), anyString());
    }

    /** Money moved and came back: distinct from an abandoned checkout, and recorded as such. */
    @Test
    void recordsARefundedPaymentAsRefunded() {
        gatewayReturns("""
                {"status":"FULL_REFUND","total_amount":"1200.00"}""");

        assertEquals(PaymentStatus.REFUNDED, service.reconcileExpiredHold(TX_ID));
        assertEquals(PaymentStatus.REFUNDED, transaction.getStatus());
    }

    /** A COMPLETE whose amount does not match must not be settled silently. */
    @Test
    void keepsTheHoldWhenTheConfirmedAmountDisagrees() {
        gatewayReturns("""
                {"status":"COMPLETE","total_amount":"10.00","ref_id":"ESW-REF-9931"}""");

        assertEquals(PaymentStatus.PENDING, service.reconcileExpiredHold(TX_ID));
        verify(bookingService, never()).settleGatewayPayment(anyLong(), anyString());
    }

    /** Settled by the browser between listing and locking; the sweep must not touch it. */
    @Test
    void ignoresATransactionThatIsNoLongerPending() {
        transaction.setStatus(PaymentStatus.COMPLETED);

        assertEquals(PaymentStatus.COMPLETED, service.reconcileExpiredHold(TX_ID));
        verify(bookingService, never()).updateStatus(anyLong(), any(), anyString());
    }

    /** Khalti is gone and cannot be looked up; no Khalti payment ever settled outside the sandbox. */
    @Test
    void releasesStaleKhaltiHoldsWithoutCallingEsewa() {
        transaction.setPaymentMethod(PaymentMethod.KHALTI);

        assertEquals(PaymentStatus.CANCELLED, service.reconcileExpiredHold(TX_ID));
        gateway.verify(); // no gateway call was expected, and none was made
    }
}
