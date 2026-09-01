package com.futsal.dto;

import com.futsal.model.enums.PaymentStatus;

/** Outcome of a gateway payment, with the booking when the payment succeeded. */
public class PaymentVerifyResponse {

    private PaymentStatus status;
    private String message;
    private String gatewayReference;
    private BookingResponse booking;

    public PaymentVerifyResponse() {}

    public PaymentVerifyResponse(PaymentStatus status, String message, String gatewayReference, BookingResponse booking) {
        this.status = status;
        this.message = message;
        this.gatewayReference = gatewayReference;
        this.booking = booking;
    }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getGatewayReference() { return gatewayReference; }
    public void setGatewayReference(String gatewayReference) { this.gatewayReference = gatewayReference; }

    public BookingResponse getBooking() { return booking; }
    public void setBooking(BookingResponse booking) { this.booking = booking; }
}
