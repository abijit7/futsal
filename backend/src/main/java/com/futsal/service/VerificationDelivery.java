package com.futsal.service;

import com.futsal.model.enums.VerificationPurpose;

public interface VerificationDelivery {
    void deliver(VerificationPurpose purpose, String destination, String code);
}
