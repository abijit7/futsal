package com.futsal.service;

import com.futsal.model.enums.BookingStatus;
import com.futsal.model.enums.PaymentMethod;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.io.ByteArrayOutputStream;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BookingNotificationServiceTest {

    private final List<MimeMessage> sent = new ArrayList<>();

    private BookingNotification booking(String venueName) {
        return new BookingNotification(
                42L,
                "player@example.com",
                "Ram Thapa",
                venueName,
                "Baneshwor, Kathmandu",
                LocalDate.of(2026, 6, 15),
                LocalTime.of(18, 0),
                LocalTime.of(19, 0),
                new BigDecimal("1200"),
                PaymentMethod.ESEWA,
                "ESW-9931",
                BookingStatus.PENDING);
    }

    /** Records what would have been sent instead of opening an SMTP connection. */
    private JavaMailSender recordingSender() {
        JavaMailSenderImpl real = new JavaMailSenderImpl();
        InvocationHandler handler = (proxy, method, args) -> {
            if ("createMimeMessage".equals(method.getName())) {
                return real.createMimeMessage();
            }
            if ("send".equals(method.getName()) && args != null && args[0] instanceof MimeMessage message) {
                sent.add(message);
                return null;
            }
            return null;
        };
        return (JavaMailSender) Proxy.newProxyInstance(
                JavaMailSender.class.getClassLoader(), new Class<?>[]{JavaMailSender.class}, handler);
    }

    @SuppressWarnings("unchecked")
    private ObjectProvider<JavaMailSender> provider(JavaMailSender sender) {
        InvocationHandler handler = (proxy, method, args) ->
                "getIfAvailable".equals(method.getName()) ? sender : null;
        return (ObjectProvider<JavaMailSender>) Proxy.newProxyInstance(
                ObjectProvider.class.getClassLoader(), new Class<?>[]{ObjectProvider.class}, handler);
    }

    private BookingNotificationService service(boolean enabled, JavaMailSender sender) {
        return new BookingNotificationService(provider(sender), enabled, "no-reply@merofutsal.test");
    }

    private String bodyOf(MimeMessage message) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        message.writeTo(out);
        return out.toString("UTF-8");
    }

    @Test
    void sendsAReceiptWithTheBookingDetails() throws Exception {
        service(true, recordingSender()).sendBookingConfirmed(booking("Futsal Arena"));

        assertEquals(1, sent.size());
        MimeMessage message = sent.get(0);
        assertEquals("Booking confirmed — Futsal Arena", message.getSubject());
        assertEquals("player@example.com", message.getAllRecipients()[0].toString());

        String body = bodyOf(message);
        assertTrue(body.contains("Futsal Arena"), "venue name should appear");
        assertTrue(body.contains("ESW-9931"), "gateway reference should appear");
        assertTrue(body.contains("1200.00"), "amount should appear");
    }

    @Test
    void sendsNothingWhenDisabled() {
        service(false, recordingSender()).sendBookingConfirmed(booking("Futsal Arena"));
        assertTrue(sent.isEmpty());
    }

    @Test
    void ignoresBookingsWithNoRecipient() {
        service(true, recordingSender()).sendBookingConfirmed(null);
        assertTrue(sent.isEmpty());
    }

    @Test
    void approvalAndCancellationUseDistinctSubjects() throws Exception {
        BookingNotificationService service = service(true, recordingSender());
        service.sendStatusChanged(booking("Futsal Arena"), BookingStatus.APPROVED);
        service.sendStatusChanged(booking("Futsal Arena"), BookingStatus.CANCELLED);

        assertEquals(2, sent.size());
        assertEquals("Booking approved — Futsal Arena", sent.get(0).getSubject());
        assertEquals("Booking cancelled — Futsal Arena", sent.get(1).getSubject());
    }

    @Test
    void pendingStatusSendsNothingBecauseTheReceiptAlreadyCoversIt() {
        service(true, recordingSender()).sendStatusChanged(booking("Futsal Arena"), BookingStatus.PENDING);
        assertTrue(sent.isEmpty());
    }

    /**
     * Venue names come from admin input and must not be able to inject markup into the HTML part.
     * The plain-text alternative carries the raw characters, which is harmless there, so this
     * asserts only that the escaped form is what reaches the HTML body.
     */
    @Test
    void escapesVenueNamesInTheHtmlBody() throws Exception {
        service(true, recordingSender()).sendBookingConfirmed(booking("<script>alert(1)</script>"));

        String html = htmlPartOf(sent.get(0));
        assertTrue(html.contains("&lt;script&gt;"), "markup should be escaped in the HTML part");
        assertFalse(html.contains("<script>alert(1)</script>"), "raw markup must not survive");
    }

    /**
     * Returns the part of the serialized message from the text/html header onwards. The MIME tree
     * is not walkable before saveChanges(), and the plain-text alternative legitimately carries
     * unescaped characters, so scoping by header is both simpler and the thing worth asserting.
     */
    private String htmlPartOf(MimeMessage message) throws Exception {
        String raw = bodyOf(message);
        int index = raw.indexOf("Content-Type: text/html");
        if (index < 0) {
            throw new AssertionError("no text/html part found in:\n" + raw);
        }
        return raw.substring(index);
    }
}
