package com.futsal.service;

import com.futsal.model.Booking;
import com.futsal.model.PaymentTransaction;
import com.futsal.model.User;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.model.enums.PaymentStatus;
import com.futsal.model.enums.Role;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Refund obligations and their confirmation.
 *
 * <p>eSewa has no merchant refund API, so this system can never move the money itself. What it must
 * get right is the bookkeeping: a refund is recorded only when money genuinely moved, and it is
 * closed out only when eSewa says the money went back.
 */
class RefundServiceTest {

    private static final long TX_ID = 901L;
    private static final String UUID = "FUTSAL-REFUND01";
    private static final String STATUS_URL = "https://rc.esewa.com.np/api/epay/transaction/status/";

    private final Clock clock = Clock.fixed(Instant.parse("2026-06-20T10:00:00Z"), ZoneId.of("UTC"));

    private PaymentTransactionRepository transactionRepository;
    private BookingNotificationService notifications;
    private MockRestServiceServer gateway;
    private RefundService service;
    private PaymentTransaction transaction;
    private Booking booking;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(PaymentTransactionRepository.class);
        notifications = mock(BookingNotificationService.class);

        RestClient.Builder builder = RestClient.builder();
        gateway = MockRestServiceServer.bindTo(builder).build();
        EsewaStatusClient statusClient = new EsewaStatusClient(builder.build());
        ReflectionTestUtils.setField(statusClient, "esewaMerchantCode", "EPAYTEST");
        ReflectionTestUtils.setField(statusClient, "esewaStatusUrl", STATUS_URL);

        service = new RefundService(transactionRepository, statusClient, notifications, clock, null);
        ReflectionTestUtils.setField(service, "overdueHours", 48);

        // A notification snapshot needs a recipient: BookingNotification.from returns null without
        // a user and an email address, and the service then quietly sends nothing.
        User customer = new User("Ram Thapa", "ram@example.com", "9812345678", "hash", Role.USER);
        customer.setUserId(7L);

        booking = new Booking();
        booking.setBookingId(55L);
        booking.setUser(customer);

        transaction = new PaymentTransaction();
        transaction.setTransactionId(TX_ID);
        transaction.setStatus(PaymentStatus.COMPLETED);
        transaction.setPaymentMethod(PaymentMethod.ESEWA);
        transaction.setIdempotencyKey(UUID);
        transaction.setAmount(new BigDecimal("1200.00"));
        transaction.setBooking(booking);

        when(transactionRepository.findByBooking(booking)).thenReturn(Optional.of(transaction));
        when(transactionRepository.findByIdForUpdate(TX_ID)).thenReturn(Optional.of(transaction));
    }

    private void gatewayReturns(String json) {
        gateway.expect(requestTo(org.hamcrest.Matchers.startsWith(STATUS_URL)))
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
    }

    // ── Recording the obligation ─────────────────────────────────────────────

    @Test
    void recordsARefundWhenAPaidBookingIsCancelled() {
        service.markRefundDue(booking, "Booking cancelled", "admin");

        assertEquals(PaymentStatus.REFUND_PENDING, transaction.getStatus());
        assertEquals("Booking cancelled", transaction.getRefundReason());
        assertEquals("admin", transaction.getRefundRequestedBy());
        assertNotNull(transaction.getRefundDueAt());
        verify(notifications).sendRefundDue(any(), any());
    }

    /**
     * The recursion guard. PaymentGatewayService.releaseHold cancels abandoned checkouts through
     * the same BookingService path that triggers this, so an unpaid hold must never produce a
     * refund for money that was never taken.
     */
    @Test
    void doesNotRecordARefundForAnUnpaidHold() {
        transaction.setStatus(PaymentStatus.PENDING);

        service.markRefundDue(booking, "Payment hold expired", "payment");

        assertEquals(PaymentStatus.PENDING, transaction.getStatus());
        assertNull(transaction.getRefundDueAt());
        verify(notifications, never()).sendRefundDue(any(), any());
    }

    /** Cash never went through a gateway, so there is nothing for the operator to return online. */
    @Test
    void doesNotRecordARefundForACashBooking() {
        transaction.setPaymentMethod(PaymentMethod.CASH_IN_HAND);

        service.markRefundDue(booking, "Booking cancelled", "admin");

        assertEquals(PaymentStatus.COMPLETED, transaction.getStatus());
        verify(notifications, never()).sendRefundDue(any(), any());
    }

    /** Re-cancelling an already refunded booking must not reopen the obligation. */
    @Test
    void doesNotRecordARefundTwice() {
        transaction.setStatus(PaymentStatus.REFUNDED);

        service.markRefundDue(booking, "Booking cancelled", "admin");

        assertEquals(PaymentStatus.REFUNDED, transaction.getStatus());
        verify(notifications, never()).sendRefundDue(any(), any());
    }

    @Test
    void ignoresABookingWithNoPaymentAtAll() {
        when(transactionRepository.findByBooking(booking)).thenReturn(Optional.empty());

        service.markRefundDue(booking, "Booking cancelled", "admin");

        verify(notifications, never()).sendRefundDue(any(), any());
    }

    // ── Confirming the refund ────────────────────────────────────────────────

    @Test
    void confirmsTheRefundWhenEsewaReportsFullRefund() {
        transaction.setStatus(PaymentStatus.REFUND_PENDING);
        transaction.setRefundDueAt(LocalDateTime.now(clock).minusHours(2));
        gatewayReturns("""
                {"status":"FULL_REFUND","total_amount":"1200.00"}""");

        assertEquals(PaymentStatus.REFUNDED, service.reconcileRefund(TX_ID));
        assertEquals(PaymentStatus.REFUNDED, transaction.getStatus());
        assertNotNull(transaction.getRefundedAt());
        verify(notifications).sendRefundCompleted(any(), any());
        gateway.verify();
    }

    /** COMPLETE means the operator has not issued the refund yet; the obligation stands. */
    @Test
    void keepsTheObligationWhileEsewaStillReportsTheOriginalPayment() {
        transaction.setStatus(PaymentStatus.REFUND_PENDING);
        transaction.setRefundDueAt(LocalDateTime.now(clock).minusHours(2));
        gatewayReturns("""
                {"status":"COMPLETE","total_amount":"1200.00"}""");

        assertEquals(PaymentStatus.REFUND_PENDING, service.reconcileRefund(TX_ID));
        assertNull(transaction.getRefundedAt());
        verify(notifications, never()).sendRefundCompleted(any(), any());
    }

    /** The policy is full refunds only, so a partial one is a disagreement a person must settle. */
    @Test
    void escalatesAPartialRefundInsteadOfClosingIt() {
        transaction.setStatus(PaymentStatus.REFUND_PENDING);
        transaction.setRefundDueAt(LocalDateTime.now(clock).minusHours(2));
        gatewayReturns("""
                {"status":"PARTIAL_REFUND","total_amount":"600.00"}""");

        assertEquals(PaymentStatus.REFUND_PENDING, service.reconcileRefund(TX_ID));
        assertEquals(PaymentStatus.REFUND_PENDING, transaction.getStatus());
        verify(notifications, never()).sendRefundCompleted(any(), any());
    }

    /** An unreachable gateway is not evidence that the refund happened. */
    @Test
    void keepsTheObligationWhenEsewaCannotBeReached() {
        transaction.setStatus(PaymentStatus.REFUND_PENDING);
        transaction.setRefundDueAt(LocalDateTime.now(clock).minusHours(2));
        gateway.expect(requestTo(org.hamcrest.Matchers.startsWith(STATUS_URL)))
                .andRespond(withServerError());

        assertEquals(PaymentStatus.REFUND_PENDING, service.reconcileRefund(TX_ID));
        assertNull(transaction.getRefundedAt());
    }

    @ParameterizedTest(name = "eSewa says {0} -> obligation kept")
    @ValueSource(strings = {"AMBIGUOUS", "NOT_FOUND", "SOMETHING_NEW"})
    void keepsTheObligationOnAnyUnrecognisedStatus(String state) {
        transaction.setStatus(PaymentStatus.REFUND_PENDING);
        transaction.setRefundDueAt(LocalDateTime.now(clock).minusHours(1));
        gatewayReturns("{\"status\":\"" + state + "\"}");

        assertEquals(PaymentStatus.REFUND_PENDING, service.reconcileRefund(TX_ID));
    }

    /** Settled between listing and locking; the sweep must leave it alone. */
    @Test
    void ignoresATransactionThatIsNoLongerPendingARefund() {
        transaction.setStatus(PaymentStatus.REFUNDED);

        assertEquals(PaymentStatus.REFUNDED, service.reconcileRefund(TX_ID));
        gateway.verify(); // no gateway call was expected, and none was made
    }

    // ── Manual confirmation ──────────────────────────────────────────────────

    @Test
    void recordsAManuallyConfirmedRefundWithItsReference() {
        transaction.setStatus(PaymentStatus.REFUND_PENDING);

        service.confirmManually(TX_ID, "BANK-TRANSFER-77", "admin@merofutsal.test");

        assertEquals(PaymentStatus.REFUNDED, transaction.getStatus());
        assertEquals("BANK-TRANSFER-77", transaction.getRefundReference());
        assertNotNull(transaction.getRefundedAt());
        verify(notifications).sendRefundCompleted(any(), any());
    }

    @Test
    void manualConfirmationIsIdempotent() {
        transaction.setStatus(PaymentStatus.REFUNDED);

        service.confirmManually(TX_ID, "ANOTHER-REF", "admin@merofutsal.test");

        assertEquals(PaymentStatus.REFUNDED, transaction.getStatus());
        verify(notifications, never()).sendRefundCompleted(any(), any());
    }
}
