package com.futsal.dto;

public class PaymentInitiationResponse {
    private String paymentUrl;
    private String paymentToken;
    private String transactionId;
    private String qrCode;
    private String message;

    public PaymentInitiationResponse() {}

    public PaymentInitiationResponse(String paymentUrl, String paymentToken, String transactionId) {
        this.paymentUrl = paymentUrl;
        this.paymentToken = paymentToken;
        this.transactionId = transactionId;
    }

    public String getPaymentUrl() { return paymentUrl; }
    public void setPaymentUrl(String paymentUrl) { this.paymentUrl = paymentUrl; }

    public String getPaymentToken() { return paymentToken; }
    public void setPaymentToken(String paymentToken) { this.paymentToken = paymentToken; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
