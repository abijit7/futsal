package com.futsal.controller;

import com.futsal.config.DemoProperties;
import com.futsal.config.EsewaEnvironments;
import com.futsal.dto.DemoInfoResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Publishes the demo logins so the sign-in screen can offer them without anyone registering.
 *
 * <p>Public by design, and therefore written to be safe when demo mode is off: the response is
 * built from {@code app.demo.enabled} first, so a deployment that never asked for a demo cannot
 * leak the account names it happens to have defaults for.
 */
@RestController
@RequestMapping("/api")
public class DemoController {

    private final DemoProperties demo;

    /**
     * The checkout form URL rather than the status URL: it is the one the browser is actually
     * posted to, so it is what decides whether eSewa's test wallet applies.
     */
    private final String esewaFormUrl;

    public DemoController(DemoProperties demo, @Value("${payment.esewa.form-url:}") String esewaFormUrl) {
        this.demo = demo;
        this.esewaFormUrl = esewaFormUrl;
    }

    @GetMapping("/demo")
    public ResponseEntity<DemoInfoResponse> info() {
        if (!demo.isEnabled()) {
            return ResponseEntity.ok(new DemoInfoResponse(false, List.of(), null));
        }

        List<DemoInfoResponse.DemoAccount> accounts = List.of(
                account("ADMIN", "Venue owner", demo.getAdmin()),
                account("USER", "Player", demo.getUser()));

        return ResponseEntity.ok(new DemoInfoResponse(true, accounts, sandboxWallet()));
    }

    private DemoInfoResponse.DemoAccount account(String role, String label, DemoProperties.Account source) {
        return new DemoInfoResponse.DemoAccount(role, label, source.getEmail(), source.getPassword());
    }

    /**
     * Only while checkout points at eSewa's sandbox. Showing test wallet numbers to somebody about
     * to be sent to the live gateway would send them to a login that cannot work.
     */
    private DemoInfoResponse.DemoPayment sandboxWallet() {
        if (!EsewaEnvironments.isSandboxUrl(esewaFormUrl)) {
            return null;
        }
        DemoProperties.Esewa esewa = demo.getEsewa();
        return new DemoInfoResponse.DemoPayment(
                esewa.getId(), esewa.getPassword(), esewa.getMpin(), esewa.getOtp());
    }
}
