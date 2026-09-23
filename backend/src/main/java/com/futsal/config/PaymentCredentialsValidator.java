package com.futsal.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

/**
 * Keeps the eSewa configuration and the deployment's intent in step.
 *
 * <p>One mistake is worth refusing to start over:
 *
 * <ul>
 *   <li><b>Production against the sandbox.</b> The prod profile deliberately provides no defaults
 *       for the merchant code or secret, but it <em>does</em> default the gateway URLs to the live
 *       hosts. A partially configured deployment would therefore sign real requests to eSewa's
 *       production endpoint with the published test key - which fails at the gateway in a way that
 *       looks like a code bug rather than a config mistake.</li>
 * </ul>
 *
 */
@Configuration
public class PaymentCredentialsValidator {

    private final Environment environment;

    @Value("${payment.esewa.merchant.code:}")
    private String merchantCode;

    @Value("${payment.esewa.merchant.secret:}")
    private String merchantSecret;

    @Value("${payment.esewa.form-url:}")
    private String formUrl;

    public PaymentCredentialsValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void validateGatewayEnvironment() {
        if (!isProdProfile()) {
            return;
        }
        if (EsewaEnvironments.isSandboxCredential(merchantCode)
                || EsewaEnvironments.isSandboxCredential(merchantSecret)) {
            throw new IllegalStateException(
                    "Refusing to start: PAYMENT_ESEWA_MERCHANT_CODE/SECRET still hold eSewa's public "
                            + "UAT credentials. Set the real merchant credentials for the prod profile.");
        }
        if (EsewaEnvironments.isSandboxUrl(formUrl)) {
            throw new IllegalStateException(
                    "Refusing to start: PAYMENT_ESEWA_FORM_URL points at eSewa's UAT environment "
                            + "while running the prod profile.");
        }
    }

    private boolean isProdProfile() {
        return environment.acceptsProfiles(Profiles.of("prod"));
    }
}
