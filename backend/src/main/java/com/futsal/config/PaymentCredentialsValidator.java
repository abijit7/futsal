package com.futsal.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.List;

/**
 * Refuses to start the production profile with eSewa's sandbox credentials.
 *
 * <p>The prod profile deliberately provides no defaults for the merchant code or secret, but it
 * *does* default the gateway URLs to the live hosts. A partially configured deployment could
 * therefore sign real requests to eSewa's production endpoint with the published test key — which
 * fails at the gateway in a way that looks like a code bug rather than a config mistake. Failing
 * fast at startup makes the real cause obvious.
 */
@Configuration
@Profile("prod")
public class PaymentCredentialsValidator {

    /** eSewa's published UAT values. Safe to name here: they are public test credentials. */
    private static final List<String> SANDBOX_VALUES = List.of("EPAYTEST", "8gBm/:&EnhH.1/q");

    @Value("${payment.esewa.merchant.code:}")
    private String merchantCode;

    @Value("${payment.esewa.merchant.secret:}")
    private String merchantSecret;

    @Value("${payment.esewa.form-url:}")
    private String formUrl;

    @PostConstruct
    void rejectSandboxCredentials() {
        if (SANDBOX_VALUES.contains(merchantCode.trim()) || SANDBOX_VALUES.contains(merchantSecret.trim())) {
            throw new IllegalStateException(
                    "Refusing to start: PAYMENT_ESEWA_MERCHANT_CODE/SECRET still hold eSewa's public "
                            + "UAT credentials. Set the real merchant credentials for the prod profile.");
        }
        if (formUrl.contains("rc-epay.") || formUrl.contains("uat.")) {
            throw new IllegalStateException(
                    "Refusing to start: PAYMENT_ESEWA_FORM_URL points at eSewa's UAT environment "
                            + "while running the prod profile.");
        }
    }
}
