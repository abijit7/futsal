package com.futsal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerificationConfirmRequest {
    @NotBlank(message = "Verification code is required")
    @Pattern(regexp = "^\\d{6}$", message = "Verification code must contain 6 digits")
    private String code;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
