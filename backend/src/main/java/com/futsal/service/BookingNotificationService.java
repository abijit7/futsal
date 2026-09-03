package com.futsal.service;

import com.futsal.model.enums.BookingStatus;
import com.futsal.model.enums.PaymentMethod;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;

/**
 * Sends booking receipts and status updates.
 *
 * <p>Every method is fire-and-forget: a booking is settled money, and a mail server being down
 * must never roll back a payment or fail the request that triggered it. Failures are logged and
 * swallowed, which is why nothing here returns a result.
 */
@Service
public class BookingNotificationService {

    private static final Logger log = LoggerFactory.getLogger(BookingNotificationService.class);

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("h:mm a");

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean enabled;
    private final String mailFrom;

    public BookingNotificationService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.notifications.email.enabled:false}") boolean enabled,
            @Value("${app.notifications.email.from:${app.verification.email.from:no-reply@merofutsal.local}}") String mailFrom
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.enabled = enabled;
        this.mailFrom = mailFrom;
    }

    /** Receipt for a booking whose payment has settled (gateway or cash-at-venue). */
    @Async
    public void sendBookingConfirmed(BookingNotification booking) {
        if (booking == null) {
            return;
        }
        boolean cash = booking.paymentMethod() == PaymentMethod.CASH_IN_HAND;
        String subject = "Booking confirmed — " + booking.venueName();
        String intro = cash
                ? "Your court is reserved. Please pay at the venue when you arrive."
                : "We have received your payment and your court is reserved.";
        send(booking, subject, intro, "Booking reference #" + booking.bookingId()
                + " is pending approval by the venue. We will email you when that is confirmed.");
    }

    /** Sent when an admin approves or rejects a booking, or when it is cancelled. */
    @Async
    public void sendStatusChanged(BookingNotification booking, BookingStatus status) {
        if (booking == null || status == null) {
            return;
        }
        String subject;
        String intro;
        String footer;
        switch (status) {
            case APPROVED -> {
                subject = "Booking approved — " + booking.venueName();
                intro = "The venue has approved your booking. See you on the court.";
                footer = "Please arrive a few minutes early.";
            }
            case REJECTED -> {
                subject = "Booking rejected — " + booking.venueName();
                intro = "The venue could not accept this booking.";
                footer = "If you had already paid, a refund is being arranged and you will "
                        + "receive a separate email confirming it.";
            }
            case CANCELLED -> {
                subject = "Booking cancelled — " + booking.venueName();
                intro = "This booking has been cancelled and the slot released.";
                footer = "If you had already paid, a refund is being arranged and you will "
                        + "receive a separate email confirming it.";
            }
            // A booking only re-enters PENDING on creation, which sendBookingConfirmed covers.
            default -> {
                return;
            }
        }
        send(booking, subject, intro, footer);
    }

    /** Sent when a paid booking is cancelled, so the customer knows money is coming back. */
    @Async
    public void sendRefundDue(BookingNotification booking, java.math.BigDecimal amount) {
        if (booking == null) {
            return;
        }
        send(booking,
                "Refund being processed — " + booking.venueName(),
                "Your booking was cancelled and the payment you made is being refunded.",
                "Refunds are returned to the eSewa account used for the original payment and "
                        + "usually take a few working days. We will email you once it is complete.");
    }

    /** Sent once the refund has actually been issued. */
    @Async
    public void sendRefundCompleted(BookingNotification booking, java.math.BigDecimal amount) {
        if (booking == null) {
            return;
        }
        send(booking,
                "Refund completed — " + booking.venueName(),
                "Your refund has been issued and is on its way back to your eSewa account.",
                "If it has not appeared within a few working days, reply to this email and we "
                        + "will look into it.");
    }

    private void send(BookingNotification booking, String subject, String intro, String footer) {
        if (!enabled) {
            log.debug("Booking email suppressed (notifications disabled): booking={}, subject={}",
                    booking.bookingId(), subject);
            return;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("Booking notifications are enabled but no mail sender is configured.");
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // Multipart is required to carry a plain-text alternative alongside the HTML body.
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(booking.recipientEmail());
            helper.setSubject(subject);
            helper.setText(plainBody(booking, intro, footer), htmlBody(booking, intro, footer));
            mailSender.send(message);
            log.info("Booking email sent: booking={}, subject={}", booking.bookingId(), subject);
        } catch (Exception ex) {
            // Never propagate: the booking is already settled and the caller must not be undone
            // by a mail failure.
            log.error("Booking email failed: booking={}, subject={}", booking.bookingId(), subject, ex);
        }
    }

    private String plainBody(BookingNotification b, String intro, String footer) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hi ").append(nameOrDefault(b)).append(",\n\n").append(intro).append("\n\n");
        sb.append("Venue:   ").append(b.venueName()).append('\n');
        if (b.venueAddress() != null && !b.venueAddress().isBlank()) {
            sb.append("Address: ").append(b.venueAddress()).append('\n');
        }
        if (b.slotDate() != null) {
            sb.append("Date:    ").append(DATE.format(b.slotDate())).append('\n');
        }
        if (b.startTime() != null && b.endTime() != null) {
            sb.append("Time:    ").append(TIME.format(b.startTime()))
              .append(" - ").append(TIME.format(b.endTime())).append('\n');
        }
        if (b.amount() != null) {
            sb.append("Amount:  NPR ").append(formatAmount(b.amount())).append('\n');
        }
        if (b.paymentMethod() != null) {
            sb.append("Payment: ").append(paymentLabel(b.paymentMethod())).append('\n');
        }
        if (b.paymentReference() != null && !b.paymentReference().isBlank()) {
            sb.append("Ref:     ").append(b.paymentReference()).append('\n');
        }
        sb.append("Booking: #").append(b.bookingId()).append('\n');
        sb.append('\n').append(footer).append("\n\n— MeroFutsal\n");
        return sb.toString();
    }

    private String htmlBody(BookingNotification b, String intro, String footer) {
        StringBuilder rows = new StringBuilder();
        row(rows, "Venue", b.venueName());
        row(rows, "Address", b.venueAddress());
        row(rows, "Date", b.slotDate() == null ? null : DATE.format(b.slotDate()));
        row(rows, "Time", b.startTime() == null || b.endTime() == null
                ? null
                : TIME.format(b.startTime()) + " – " + TIME.format(b.endTime()));
        row(rows, "Amount", b.amount() == null ? null : "NPR " + formatAmount(b.amount()));
        row(rows, "Payment", b.paymentMethod() == null ? null : paymentLabel(b.paymentMethod()));
        row(rows, "Reference", b.paymentReference());
        row(rows, "Booking", "#" + b.bookingId());

        return """
                <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#0f172a;max-width:560px">
                  <h2 style="color:#0D1B2A;margin:0 0 4px">MeroFutsal</h2>
                  <p style="margin:0 0 16px">Hi %s,</p>
                  <p style="margin:0 0 16px">%s</p>
                  <table style="border-collapse:collapse;width:100%%;font-size:14px">%s</table>
                  <p style="margin:16px 0 0;color:#475569;font-size:13px">%s</p>
                </div>
                """.formatted(escape(nameOrDefault(b)), escape(intro), rows, escape(footer));
    }

    private void row(StringBuilder sb, String label, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        sb.append("<tr><td style=\"padding:6px 12px 6px 0;color:#64748b\">")
          .append(escape(label))
          .append("</td><td style=\"padding:6px 0;font-weight:600\">")
          .append(escape(value))
          .append("</td></tr>");
    }

    private String nameOrDefault(BookingNotification b) {
        return b.recipientName() == null || b.recipientName().isBlank() ? "there" : b.recipientName();
    }

    private String formatAmount(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String paymentLabel(PaymentMethod method) {
        return switch (method) {
            case ESEWA -> "eSewa";
            case KHALTI -> "Khalti (discontinued)";
            case CASH_IN_HAND -> "Cash at venue";
        };
    }

    /** Venue names and addresses are user-supplied, so they are escaped before going into HTML. */
    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
