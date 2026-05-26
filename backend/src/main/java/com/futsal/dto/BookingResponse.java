package com.futsal.dto;

import com.futsal.model.enums.BookingStatus;
import com.futsal.model.enums.PaymentMethod;
import java.time.LocalDateTime;

public class BookingResponse {
    private Long bookingId;
    private BookingStatus status;
    private PaymentMethod paymentMethod;
    private String paymentRef;
    private LocalDateTime paidAt;
    private LocalDateTime bookedAt;
    private String notes;
    private UserSummary user;
    private TimeSlotSummary timeSlot;

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }

    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentRef() { return paymentRef; }
    public void setPaymentRef(String paymentRef) { this.paymentRef = paymentRef; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public LocalDateTime getBookedAt() { return bookedAt; }
    public void setBookedAt(LocalDateTime bookedAt) { this.bookedAt = bookedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public UserSummary getUser() { return user; }
    public void setUser(UserSummary user) { this.user = user; }

    public TimeSlotSummary getTimeSlot() { return timeSlot; }
    public void setTimeSlot(TimeSlotSummary timeSlot) { this.timeSlot = timeSlot; }
}

