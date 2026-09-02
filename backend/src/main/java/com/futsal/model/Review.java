package com.futsal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * A rating a customer left for a venue after playing there.
 *
 * <p>Bound to the booking it came from, not just to the venue: that is what lets
 * {@code ReviewService} require a real, approved, past visit before accepting a review, and what
 * the unique key {@code (futsal_id, user_id, booking_id)} enforces.
 */
@Entity
@Table(
        name = "reviews",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_review_booking",
                columnNames = {"futsal_id", "user_id", "booking_id"})
)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reviewId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "futsal_id", nullable = false)
    private Futsal futsal;

    @NotNull
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    @Column(nullable = false)
    private int rating;

    @Size(max = 500, message = "Comment must be 500 characters or fewer")
    @Column(length = 500)
    private String comment;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    public Review() {}

    public Review(Futsal futsal, User user, Booking booking, int rating, String comment) {
        this.futsal = futsal;
        this.user = user;
        this.booking = booking;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = LocalDateTime.now();
    }

    public Long getReviewId()               { return reviewId; }
    public void setReviewId(Long reviewId)  { this.reviewId = reviewId; }

    public Futsal getFutsal()               { return futsal; }
    public void setFutsal(Futsal futsal)    { this.futsal = futsal; }

    public User getUser()                   { return user; }
    public void setUser(User user)          { this.user = user; }

    public Booking getBooking()             { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }

    public int getRating()                  { return rating; }
    public void setRating(int rating)       { this.rating = rating; }

    public String getComment()              { return comment; }
    public void setComment(String comment)  { this.comment = comment; }

    public LocalDateTime getCreatedAt()                  { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt)    { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt()                  { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt)    { this.updatedAt = updatedAt; }
}
