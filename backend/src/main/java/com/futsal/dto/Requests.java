package com.futsal.dto;

// ── Login Request ─────────────────────────────────────────────────────────────
class LoginRequest {
    private String email;
    private String password;

    public String getEmail()              { return email; }
    public void setEmail(String email)    { this.email = email; }
    public String getPassword()           { return password; }
    public void setPassword(String pw)    { this.password = pw; }
}

// ── Booking Request ───────────────────────────────────────────────────────────
class BookingRequest {
    private Long userId;
    private Long slotId;
    private String notes;

    public Long getUserId()               { return userId; }
    public void setUserId(Long userId)    { this.userId = userId; }
    public Long getSlotId()               { return slotId; }
    public void setSlotId(Long slotId)    { this.slotId = slotId; }
    public String getNotes()              { return notes; }
    public void setNotes(String notes)    { this.notes = notes; }
}

// ── Status Update Request ─────────────────────────────────────────────────────
class StatusRequest {
    private String status;
    public String getStatus()             { return status; }
    public void setStatus(String status)  { this.status = status; }
}
