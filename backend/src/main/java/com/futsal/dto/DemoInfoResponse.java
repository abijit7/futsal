package com.futsal.dto;

import java.util.List;

/**
 * What {@code GET /api/demo} publishes so the sign-in screen and the checkout can offer working
 * credentials to a visitor who has never registered.
 *
 * <p>This deliberately hands out a real, working admin login, which is only defensible because
 * {@code app.demo.enabled} is off unless a deployment asks for it and
 * {@code PaymentCredentialsValidator} then refuses to start that deployment against eSewa's live
 * gateway. When demo mode is off, every field here is empty.
 *
 * @param enabled  whether this deployment is a demo at all
 * @param accounts the seeded logins, admin first; empty unless demo mode is on
 * @param payment  eSewa's published sandbox wallet, or null when checkout is not pointed at the
 *                 sandbox - advertising test wallet numbers for a live gateway would be misleading
 */
public record DemoInfoResponse(boolean enabled, List<DemoAccount> accounts, DemoPayment payment) {

    /** One seeded login, password included: that is the point of demo mode. */
    public record DemoAccount(String role, String label, String email, String password) {
    }

    /** eSewa's published UAT test wallet. Public sandbox values, not credentials. */
    public record DemoPayment(String esewaId, String esewaPassword, String mpin, String otp) {
    }
}
