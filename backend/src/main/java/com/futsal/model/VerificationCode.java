package com.futsal.model;

import com.futsal.model.enums.VerificationPurpose;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "verification_codes",
        indexes = {
                @Index(name = "idx_verification_user_purpose", columnList = "user_id,purpose"),
                @Index(name = "idx_verification_expiry", columnList = "expires_at")
        }
)
public class VerificationCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long verificationCodeId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private VerificationPurpose purpose;

    @Column(nullable = false, length = 120)
    private String destination;

    @Column(nullable = false, length = 64)
    private String codeHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @Column(nullable = false)
    private int attempts;

    public Long getVerificationCodeId() { return verificationCodeId; }
    public void setVerificationCodeId(Long verificationCodeId) { this.verificationCodeId = verificationCodeId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public VerificationPurpose getPurpose() { return purpose; }
    public void setPurpose(VerificationPurpose purpose) { this.purpose = purpose; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String codeHash) { this.codeHash = codeHash; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getConsumedAt() { return consumedAt; }
    public void setConsumedAt(LocalDateTime consumedAt) { this.consumedAt = consumedAt; }
    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
}
