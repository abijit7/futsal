package com.futsal.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

/**
 * Covers eSewa's HMAC-SHA256 request signing.
 *
 * <p>The message format is from eSewa's ePay v2 documentation: the signed fields joined as
 * {@code name=value} pairs with commas, in the order given by signed_field_names, HMAC-SHA256 with
 * the merchant secret, base64 encoded. The expected digests below were produced by an independent
 * HMAC implementation, so this is a cross-implementation check of the algorithm rather than a
 * restatement of the code under test.
 *
 * <p>This matters because the previous implementation's signature "verification" returned true for
 * any non-empty string, which would have accepted a forged payment confirmation.
 */
class PaymentGatewayServiceTest {

    /**
     * eSewa's published UAT merchant secret, verbatim.
     *
     * <p>This previously carried a trailing "(" that is not part of the real key. The digest
     * asserted below was generated with that same wrong secret, so the test passed while every
     * real UAT transaction would have been rejected for a bad signature. The expected value now
     * comes from eSewa's own documented worked example, which pins the secret, the field order
     * and the "name=value" message format to the vendor rather than to our own output.
     */
    private static final String UAT_SECRET = "8gBm/:&EnhH.1/q";

    private PaymentGatewayService service;

    @BeforeEach
    void setUp() {
        service = new PaymentGatewayService(null, null, null, null, null, null, null, null, null);
        ReflectionTestUtils.setField(service, "esewaMerchantSecret", UAT_SECRET);
    }

    @Test
    void reproducesTheSignatureFromEsewasDocumentedExample() {
        String signature = service.esewaSignature(
                Map.of(
                        "total_amount", "110",
                        "transaction_uuid", "241028",
                        "product_code", "EPAYTEST"
                ),
                List.of("total_amount", "transaction_uuid", "product_code"));

        assertEquals("i94zsd3oXF6ZsSr/kGqT4sSzYQzjj1W/waxjWyRwaME=", signature);
    }

    /** signed_field_names is ordered; signing the same values in another order must not match. */
    @Test
    void fieldOrderIsPartOfTheSignature() {
        Map<String, String> values = Map.of(
                "total_amount", "100",
                "transaction_uuid", "11-201-13",
                "product_code", "EPAYTEST"
        );

        String documented = service.esewaSignature(
                values, List.of("total_amount", "transaction_uuid", "product_code"));
        String shuffled = service.esewaSignature(
                values, List.of("product_code", "transaction_uuid", "total_amount"));

        assertNotEquals(documented, shuffled);
    }

    /** A tampered amount must not reproduce the original signature. */
    @Test
    void tamperedAmountProducesADifferentSignature() {
        List<String> fields = List.of("total_amount", "transaction_uuid", "product_code");

        String genuine = service.esewaSignature(
                Map.of("total_amount", "100", "transaction_uuid", "11-201-13", "product_code", "EPAYTEST"),
                fields);
        String tampered = service.esewaSignature(
                Map.of("total_amount", "1", "transaction_uuid", "11-201-13", "product_code", "EPAYTEST"),
                fields);

        assertNotEquals(genuine, tampered);
    }

    /** Whitespace around signed_field_names entries is tolerated; the digest is unchanged. */
    @Test
    void trimsFieldNamesFromTheGatewayResponse() {
        Map<String, String> values = Map.of(
                "total_amount", "100",
                "transaction_uuid", "11-201-13",
                "product_code", "EPAYTEST"
        );

        assertEquals(
                service.esewaSignature(values, List.of("total_amount", "transaction_uuid", "product_code")),
                service.esewaSignature(values, List.of(" total_amount", "transaction_uuid ", " product_code ")));
    }
}
