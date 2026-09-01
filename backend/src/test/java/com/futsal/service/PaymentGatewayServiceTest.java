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

    /** eSewa's published UAT merchant secret. */
    private static final String UAT_SECRET = "8gBm/:&EnhH.1/q(";

    private PaymentGatewayService service;

    @BeforeEach
    void setUp() {
        service = new PaymentGatewayService(null, null, null, null, null, null);
        ReflectionTestUtils.setField(service, "esewaMerchantSecret", UAT_SECRET);
    }

    @Test
    void signsTheDocumentedFieldOrder() {
        String signature = service.esewaSignature(
                Map.of(
                        "total_amount", "100",
                        "transaction_uuid", "11-201-13",
                        "product_code", "EPAYTEST"
                ),
                List.of("total_amount", "transaction_uuid", "product_code"));

        assertEquals("+jWFkfo8GeBSZ0iFw2O2QQ/hwHAjSPo7Tlbf/HWw50A=", signature);
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
