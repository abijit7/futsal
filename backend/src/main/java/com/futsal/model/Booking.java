package com.futsal.model;

import com.futsal.model.enums.BookingStatus;
import com.futsal.model.enums.PaymentMethod;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookingId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "slot_id", nullable = false)
    private TimeSlot timeSlot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Column(nullable = false, length = 80)
    private String paymentRef;

    @Column(nullable = false)
    private LocalDateTime paidAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime bookedAt = LocalDateTime.now();

    @Column(length = 500)
    private String notes;

    // ── Constructors ──────────────────────────────────────────
    public Booking() {}

    public Booking(User user, TimeSlot timeSlot, String notes, PaymentMethod paymentMethod, String paymentRef) {
        this.user = user;
        this.timeSlot = timeSlot;
        this.notes = notes;
        this.paymentMethod = paymentMethod;
        this.paymentRef = paymentRef;
        this.paidAt = LocalDateTime.now();
    }

    // ── Getters & Setters ─────────────────────────────────────
    public Long getBookingId()                       { return bookingId; }
    public void setBookingId(Long bookingId)         { this.bookingId = bookingId; }

    public User getUser()                            { return user; }
    public void setUser(User user)                   { this.user = user; }

    public TimeSlot getTimeSlot()                    { return timeSlot; }
    public void setTimeSlot(TimeSlot timeSlot)       { this.timeSlot = timeSlot; }

    public BookingStatus getStatus()                 { return status; }
    public void setStatus(BookingStatus status)      { this.status = status; }

    public PaymentMethod getPaymentMethod()            { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentRef()                      { return paymentRef; }
    public void setPaymentRef(String paymentRef)       { this.paymentRef = paymentRef; }

    public LocalDateTime getPaidAt()                   { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt)        { this.paidAt = paidAt; }

    public LocalDateTime getBookedAt()               { return bookedAt; }
    public void setBookedAt(LocalDateTime bookedAt)  { this.bookedAt = bookedAt; }

    public String getNotes()                         { return notes; }
    public void setNotes(String notes)               { this.notes = notes; }
}
