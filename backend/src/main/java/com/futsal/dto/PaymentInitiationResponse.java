package com.futsal.dto;

import com.futsal.model.enums.PaymentMethod;

import java.math.BigDecimal;
import java.util.Map;

/**
 * How the browser should continue the payment.
 *
 * <p>The two gateways need different handoffs: eSewa requires an auto-submitted HTML form POST
 * ({@code formUrl} + {@code formFields}), Khalti a plain redirect ({@code redirectUrl}). Cash
 * needs neither and returns the finished {@code booking}.
 */
public class PaymentInitiationResponse {

    private String transactionId;
    private PaymentMethod method;
    private BigDecimal amount;
    private String message;

    /** eSewa: POST formFields to formUrl. */
    private String formUrl;
    private Map<String, String> formFields;

    /** Khalti: send the browser here. */
    private String redirectUrl;

    /** Cash in hand: nothing to redirect to, the booking already exists. */
    private BookingResponse booking;

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public PaymentMethod getMethod() { return method; }
    public void setMethod(PaymentMethod method) { this.method = method; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getFormUrl() { return formUrl; }
    public void setFormUrl(String formUrl) { this.formUrl = formUrl; }

    public Map<String, String> getFormFields() { return formFields; }
    public void setFormFields(Map<String, String> formFields) { this.formFields = formFields; }

    public String getRedirectUrl() { return redirectUrl; }
    public void setRedirectUrl(String redirectUrl) { this.redirectUrl = redirectUrl; }

    public BookingResponse getBooking() { return booking; }
    public void setBooking(BookingResponse booking) { this.booking = booking; }
}
