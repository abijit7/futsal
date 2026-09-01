package com.futsal.dto;

/**
 * Confirms a gateway payment after the browser comes back from the gateway.
 *
 * <p>Exactly one identifier is expected: {@code data} for eSewa (the base64 JSON blob it appends
 * to success_url) or {@code pidx} for Khalti. Neither is trusted on its own - eSewa's blob has its
 * HMAC recomputed and is then confirmed against the status API, and Khalti's pidx is resolved
 * through the lookup API, which is the only authoritative source for a Khalti payment.
 */
public class PaymentVerifyRequest {

    private String data;
    private String pidx;

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    public String getPidx() { return pidx; }
    public void setPidx(String pidx) { this.pidx = pidx; }
}
