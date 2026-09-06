package com.futsal.controller;

import com.futsal.config.DemoProperties;
import com.futsal.dto.DemoInfoResponse;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The demo endpoint hands out working credentials, so what it must never do is hand them out when
 * the deployment did not ask for demo mode - or advertise a sandbox test wallet while checkout is
 * pointed at a real gateway.
 */
class DemoControllerTest {

    private static final String SANDBOX_FORM_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
    private static final String LIVE_FORM_URL = "https://epay.esewa.com.np/api/epay/main/v2/form";

    @Test
    void publishesNothingWhileDemoModeIsOff() {
        DemoInfoResponse body = new DemoController(properties(false), SANDBOX_FORM_URL).info().getBody();

        assertThat(body).isNotNull();
        assertThat(body.enabled()).isFalse();
        assertThat(body.accounts()).isEmpty();
        assertThat(body.payment()).isNull();
    }

    @Test
    void publishesBothAccountsAndTheSandboxWalletWhenEnabled() {
        DemoInfoResponse body = new DemoController(properties(true), SANDBOX_FORM_URL).info().getBody();

        assertThat(body).isNotNull();
        assertThat(body.enabled()).isTrue();
        assertThat(body.accounts()).extracting(DemoInfoResponse.DemoAccount::role)
                .containsExactly("ADMIN", "USER");
        assertThat(body.accounts()).extracting(DemoInfoResponse.DemoAccount::email)
                .containsExactly("admin@merofutsal.local", "player@merofutsal.local");
        assertThat(body.payment()).isNotNull();
        assertThat(body.payment().esewaId()).isEqualTo("9806800001");
    }

    @Test
    void withholdsTheTestWalletWhenCheckoutPointsAtTheLiveGateway() {
        DemoInfoResponse body = new DemoController(properties(true), LIVE_FORM_URL).info().getBody();

        assertThat(body).isNotNull();
        assertThat(body.enabled()).isTrue();
        assertThat(body.payment()).isNull();
    }

    private DemoProperties properties(boolean enabled) {
        DemoProperties properties = new DemoProperties();
        properties.setEnabled(enabled);
        properties.getAdmin().setEmail("admin@merofutsal.local");
        properties.getAdmin().setPassword("DemoAdmin123");
        properties.getUser().setEmail("player@merofutsal.local");
        properties.getUser().setPassword("DemoPlayer123");
        properties.getEsewa().setId("9806800001");
        properties.getEsewa().setPassword("Nepal@123");
        properties.getEsewa().setMpin("1122");
        properties.getEsewa().setOtp("123456");
        return properties;
    }
}
