package com.futsal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.futsal.error.ApiServerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * eSewa's transaction status API — the only thing this system treats as proof of what happened to
 * a payment.
 *
 * <p>Extracted from {@code PaymentGatewayService} because two independent sweeps need it: the
 * payment reconciliation that settles or releases an expired hold, and the refund reconciliation
 * that watches for a dashboard refund. Duplicating an HTTP call that decides whether money moved
 * is not worth the convenience.
 *
 * <p>The status endpoint is also the *only* way this system learns about a refund, since eSewa
 * exposes no merchant refund API — a refund issued in the merchant dashboard surfaces here as
 * {@code FULL_REFUND}.
 */
@Component
public class EsewaStatusClient {

    private static final Logger log = LoggerFactory.getLogger(EsewaStatusClient.class);

    private final RestClient restClient;

    @Value("${payment.esewa.merchant.code}")
    private String esewaMerchantCode;

    @Value("${payment.esewa.status-url}")
    private String esewaStatusUrl;

    public EsewaStatusClient(RestClient gatewayRestClient) {
        this.restClient = gatewayRestClient;
    }

    /**
     * Fetches the current status of one transaction.
     *
     * @param transactionUuid our own transaction reference, sent to eSewa as {@code transaction_uuid}
     * @param totalAmount     the amount formatted exactly as it was signed
     * @throws ApiServerException when eSewa cannot be reached — never interpret this as "not paid"
     */
    public JsonNode fetch(String transactionUuid, String totalAmount) {
        String uri = UriComponentsBuilder.fromUriString(esewaStatusUrl)
                .queryParam("product_code", esewaMerchantCode)
                .queryParam("total_amount", totalAmount)
                .queryParam("transaction_uuid", transactionUuid)
                .toUriString();
        try {
            return restClient.get().uri(uri).retrieve().body(JsonNode.class);
        } catch (RuntimeException ex) {
            // Log the full exception and the URL that was called. A misconfigured status host used
            // to surface only as "Unexpected server error", which gave no way to tell a bad URL
            // from a genuine eSewa outage. The URL carries no secrets.
            log.error("eSewa status check failed for transaction_uuid={} against {}", transactionUuid, uri, ex);
            throw new ApiServerException(
                    "Could not reach eSewa to confirm this payment. Please try again shortly.", ex);
        }
    }
}
