package com.futsal.dto;

public class VerificationIssueResponse {
    private String message;
    private long expiresInSeconds;
    private String devCode;

    public VerificationIssueResponse(String message, long expiresInSeconds, String devCode) {
        this.message = message;
        this.expiresInSeconds = expiresInSeconds;
        this.devCode = devCode;
    }

    public String getMessage() { return message; }
    public long getExpiresInSeconds() { return expiresInSeconds; }
    public String getDevCode() { return devCode; }
}
