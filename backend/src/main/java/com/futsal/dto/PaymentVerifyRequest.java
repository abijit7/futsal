package com.futsal.dto;

/**
 * Confirms a gateway payment after the browser comes back from the gateway.
 *
 * <p>Exactly one identifier is expected: {@code data} for eSewa (the base64 JSON blob it appends
 * to success_url). It is not trusted on its own: the blob's HMAC is recomputed and then confirmed
 * against eSewa's transaction status API, which is the only authoritative source of truth.
 */
public class PaymentVerifyRequest {

    private String data;

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
