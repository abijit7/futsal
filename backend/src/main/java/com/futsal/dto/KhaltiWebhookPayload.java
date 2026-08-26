package com.futsal.dto;

public class KhaltiWebhookPayload {
    private String idx;
    private String amount;
    private String mobile;
    private String transaction_id;
    private String status;
    private String fee_amount;
    private String total_amount;
    private String transaction_type;
    private String created_on;
    private String signature;

    // Getters and Setters
    public String getIdx() { return idx; }
    public void setIdx(String idx) { this.idx = idx; }

    public String getAmount() { return amount; }
    public void setAmount(String amount) { this.amount = amount; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getTransaction_id() { return transaction_id; }
    public void setTransaction_id(String transaction_id) { this.transaction_id = transaction_id; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFee_amount() { return fee_amount; }
    public void setFee_amount(String fee_amount) { this.fee_amount = fee_amount; }

    public String getTotal_amount() { return total_amount; }
    public void setTotal_amount(String total_amount) { this.total_amount = total_amount; }

    public String getTransaction_type() { return transaction_type; }
    public void setTransaction_type(String transaction_type) { this.transaction_type = transaction_type; }

    public String getCreated_on() { return created_on; }
    public void setCreated_on(String created_on) { this.created_on = created_on; }

    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }
}
