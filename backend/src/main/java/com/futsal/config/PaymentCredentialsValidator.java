package com.futsal.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

/**
 * Keeps the eSewa configuration and the deployment's intent in step.
 *
 * <p>Two mistakes are worth refusing to start over:
 *
 * <ul>
 *   <li><b>Production against the sandbox.</b> The prod profile deliberately provides no defaults
 *       for the merchant code or secret, but it <em>does</em> default the gateway URLs to the live
 *       hosts. A partially configured deployment would therefore sign real requests to eSewa's
 *       production endpoint with the published test key - which fails at the gateway in a way that
 *       looks like a code bug rather than a config mistake.</li>
 *   <li><b>Demo mode against the live gateway.</b> Demo mode publishes a working login to anyone
 *       who asks; pointing its checkout at real eSewa would let a stranger move real money.</li>
 * </ul>
 *
 * <p>The demo check is not restricted to the prod profile, because demo mode is exactly the case
 * where a non-prod-looking deployment is exposed to the public internet.
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

    @Value("${app.demo.enabled:false}")
    private boolean demoEnabled;

    public PaymentCredentialsValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void validateGatewayEnvironment() {
        if (demoEnabled && !EsewaEnvironments.isSandboxUrl(formUrl)) {
            throw new IllegalStateException(
                    "Refusing to start: demo mode publishes shared login credentials, so "
                            + "PAYMENT_ESEWA_FORM_URL must point at eSewa's UAT sandbox "
                            + "(https://rc-epay.esewa.com.np/...). Turn off DEMO_MODE_ENABLED to take "
                            + "real payments.");
        }
        if (!isProdProfile() || demoEnabled) {
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
