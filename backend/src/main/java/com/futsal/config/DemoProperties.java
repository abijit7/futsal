package com.futsal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Demo mode: shared accounts and seeded venues so that somebody looking at this as a portfolio
 * project can sign in, browse real slots and run a payment without registering first.
 *
 * <p>Everything here is off unless {@code app.demo.enabled} is true, because the credentials it
 * describes are handed out publicly by {@code GET /api/demo}. A deployment that turns it on is
 * deliberately publishing a working admin login, so {@code PaymentCredentialsValidator} refuses
 * to pair demo mode with eSewa's live gateway - a visitor using the published account must never
 * be able to move real money.
 */
@Component
@ConfigurationProperties(prefix = "app.demo")
public class DemoProperties {

    private boolean enabled;

    private Account admin = new Account();

    private Account user = new Account();

    private Esewa esewa = new Esewa();

    /** How many days of hourly slots the seeder keeps ahead of today for each demo venue. */
    private int slotDays = 7;

    /** Minutes per generated slot. */
    private int slotMinutes = 60;

    /**
     * How often the seed is re-applied. This is not just repair: it rolls the slot window
     * forward, without which an always-on demo runs out of bookable slots after {@link #slotDays}.
     */
    private long refreshIntervalMs = 21_600_000L;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public Account getAdmin() { return admin; }
    public void setAdmin(Account admin) { this.admin = admin; }

    public Account getUser() { return user; }
    public void setUser(Account user) { this.user = user; }

    public Esewa getEsewa() { return esewa; }
    public void setEsewa(Esewa esewa) { this.esewa = esewa; }

    public int getSlotDays() { return slotDays; }
    public void setSlotDays(int slotDays) { this.slotDays = slotDays; }

    public int getSlotMinutes() { return slotMinutes; }
    public void setSlotMinutes(int slotMinutes) { this.slotMinutes = slotMinutes; }

    public long getRefreshIntervalMs() { return refreshIntervalMs; }
    public void setRefreshIntervalMs(long refreshIntervalMs) { this.refreshIntervalMs = refreshIntervalMs; }

    /** One seeded login. The password is stored hashed like any other account. */
    public static class Account {
        private String name;
        private String email;
        private String phone;
        private String password;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    /**
     * eSewa's published UAT test wallet. These are documented sandbox values, not credentials -
     * but they are configurable because eSewa has rotated them before and a stale hint on the
     * checkout screen is worse than none.
     */
    public static class Esewa {
        private String id;
        private String password;
        private String mpin;
        private String otp;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getMpin() { return mpin; }
        public void setMpin(String mpin) { this.mpin = mpin; }

        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
    }
}
