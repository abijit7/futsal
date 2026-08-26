package com.futsal.service;

import com.futsal.model.enums.VerificationPurpose;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class VerificationDeliveryService implements VerificationDelivery {
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final RestClient restClient;
    private final boolean exposeCode;
    private final boolean emailEnabled;
    private final String mailFrom;
    private final String smsWebhookUrl;

    public VerificationDeliveryService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.verification.expose-code:false}") boolean exposeCode,
            @Value("${app.verification.email.enabled:false}") boolean emailEnabled,
            @Value("${app.verification.email.from:no-reply@merofutsal.local}") String mailFrom,
            @Value("${app.verification.sms.webhook-url:}") String smsWebhookUrl
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.restClient = RestClient.create();
        this.exposeCode = exposeCode;
        this.emailEnabled = emailEnabled;
        this.mailFrom = mailFrom;
        this.smsWebhookUrl = smsWebhookUrl == null ? "" : smsWebhookUrl.trim();
    }

    @Override
    public void deliver(VerificationPurpose purpose, String destination, String code) {
        if (purpose == VerificationPurpose.PHONE_VERIFICATION) {
            deliverSms(destination, code);
            return;
        }
        deliverEmail(purpose, destination, code);
    }

    private void deliverEmail(VerificationPurpose purpose, String destination, String code) {
        if (!emailEnabled) {
            requireDevelopmentCodeExposure("Email delivery is not configured");
            return;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new IllegalStateException("Email delivery is enabled but no mail sender is available");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(destination);
        message.setSubject(purpose == VerificationPurpose.PASSWORD_RESET
                ? "MeroFutsal password reset code"
                : "Verify your MeroFutsal email");
        message.setText("Your MeroFutsal verification code is " + code
                + ". It expires shortly. Do not share this code.");
        mailSender.send(message);
    }

    private void deliverSms(String destination, String code) {
        if (smsWebhookUrl.isBlank()) {
            requireDevelopmentCodeExposure("SMS delivery is not configured");
            return;
        }
        restClient.post()
                .uri(smsWebhookUrl)
                .body(Map.of(
                        "phone", destination,
                        "message", "Your MeroFutsal verification code is " + code
                ))
                .retrieve()
                .toBodilessEntity();
    }

    private void requireDevelopmentCodeExposure(String message) {
        if (!exposeCode) {
            throw new IllegalStateException(message);
        }
    }
}
