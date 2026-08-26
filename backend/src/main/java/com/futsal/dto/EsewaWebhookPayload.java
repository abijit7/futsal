package com.futsal.dto;

public class EsewaWebhookPayload {
    private String transactionId;
    private String productId;
    private String amount;
    private String status;
    private String message;
    private String signature;
    private String refId;

    // Getters and Setters
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getAmount() { return amount; }
    public void setAmount(String amount) { this.amount = amount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }

    public String getRefId() { return refId; }
    public void setRefId(String refId) { this.refId = refId; }
}
