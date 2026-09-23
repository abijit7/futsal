package com.futsal.config;

import java.util.List;

/**
 * Tells eSewa's sandbox apart from its live environment.
 *
 * <p>Shared so that the places that care cannot drift apart: {@link PaymentCredentialsValidator}
 * refuses to start the prod profile against the sandbox.
 */
public final class EsewaEnvironments {

    /** eSewa's published UAT merchant values. Safe to name here: they are public test credentials. */
    private static final List<String> SANDBOX_CREDENTIALS = List.of("EPAYTEST", "8gBm/:&EnhH.1/q");

    private EsewaEnvironments() {
    }

    public static boolean isSandboxCredential(String value) {
        return value != null && SANDBOX_CREDENTIALS.contains(value.trim());
    }

    /** UAT lives on rc-epay.esewa.com.np; the retired uat.* host is matched for old configs. */
    public static boolean isSandboxUrl(String url) {
        return url != null && (url.contains("rc-epay.") || url.contains("rc.esewa.") || url.contains("uat."));
    }
}
