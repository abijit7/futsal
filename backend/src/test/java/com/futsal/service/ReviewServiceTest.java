package com.futsal.service;

import com.futsal.error.ConflictException;
import com.futsal.model.Booking;
import com.futsal.model.Futsal;
import com.futsal.model.Review;
import com.futsal.model.TimeSlot;
import com.futsal.model.User;
import com.futsal.model.enums.BookingStatus;
import com.futsal.model.enums.Role;
import com.futsal.repository.BookingRepository;
import com.futsal.repository.FutsalRepository;
import com.futsal.repository.ReviewRepository;
import com.futsal.repository.UserRepository;
import com.futsal.security.SecurityAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReviewServiceTest {

    private static final Long FUTSAL_ID = 7L;
    private static final Long USER_ID = 3L;
    private static final Long BOOKING_ID = 11L;

    // "Now" is the evening of 15 June 2026; the fixture booking finished at 19:00 that day.
    private final Clock clock = Clock.fixed(
            LocalDate.of(2026, 6, 15).atTime(21, 0).atZone(ZoneId.of("UTC")).toInstant(),
            ZoneId.of("UTC"));

    private ReviewRepository reviewRepository;
    private BookingRepository bookingRepository;
    private FutsalRepository futsalRepository;
    private UserRepository userRepository;
    private ReviewService service;

    private Futsal futsal;
    private User user;

    @BeforeEach
    void setUp() {
        reviewRepository = mock(ReviewRepository.class);
        bookingRepository = mock(BookingRepository.class);
        futsalRepository = mock(FutsalRepository.class);
        userRepository = mock(UserRepository.class);
        SecurityAuth securityAuth = mock(SecurityAuth.class);
        doNothing().when(securityAuth).requireUserOrAdmin(anyLong());

        service = new ReviewService(reviewRepository, bookingRepository, futsalRepository,
                userRepository, securityAuth, clock);

        futsal = new Futsal();
        futsal.setFutsalId(FUTSAL_ID);
        futsal.setName("Futsal Arena");

        user = new User("Ram Thapa", "ram@example.com", "9812345678", "hash", Role.USER);
        user.setUserId(USER_ID);

        when(futsalRepository.findById(FUTSAL_ID)).thenReturn(Optional.of(futsal));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(reviewRepository.saveAndFlush(any(Review.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Booking booking(BookingStatus status, LocalDate date, LocalTime end, Long futsalId, Long ownerId) {
        Futsal slotFutsal = new Futsal();
        slotFutsal.setFutsalId(futsalId);

        TimeSlot slot = new TimeSlot();
        slot.setFutsal(slotFutsal);
        slot.setSlotDate(date);
        slot.setStartTime(end.minusHours(1));
        slot.setEndTime(end);

        User owner = new User("Other Player", "other@example.com", "9812345679", "hash", Role.USER);
        owner.setUserId(ownerId);

        Booking booking = new Booking();
        booking.setBookingId(BOOKING_ID);
        booking.setStatus(status);
        booking.setTimeSlot(slot);
        booking.setUser(owner);
        return booking;
    }

    private Booking eligibleBooking() {
        return booking(BookingStatus.APPROVED, LocalDate.of(2026, 6, 15), LocalTime.of(19, 0), FUTSAL_ID, USER_ID);
    }

    private void givenBooking(Booking booking) {
        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
    }

    @Test
    void acceptsAReviewForAnApprovedBookingAlreadyPlayed() {
        givenBooking(eligibleBooking());
        when(reviewRepository.countByFutsal_FutsalId(FUTSAL_ID)).thenReturn(1L);
        when(reviewRepository.averageRatingForFutsal(FUTSAL_ID)).thenReturn(4.0);

        Review review = service.create(FUTSAL_ID, USER_ID, BOOKING_ID, 4, "  Great turf  ");

        assertEquals(4, review.getRating());
        assertEquals("Great turf", review.getComment(), "comment should be trimmed");
        assertEquals(new BigDecimal("4.0"), futsal.getRating());
        assertEquals(1, futsal.getReviewCount());
    }

    @Test
    void rejectsAReviewForSomeoneElsesBooking() {
        givenBooking(booking(BookingStatus.APPROVED, LocalDate.of(2026, 6, 15), LocalTime.of(19, 0), FUTSAL_ID, 999L));

        ConflictException ex = assertThrows(ConflictException.class,
                () -> service.create(FUTSAL_ID, USER_ID, BOOKING_ID, 5, null));
        assertEquals("You can only review your own bookings.", ex.getMessage());
    }

    @Test
    void rejectsAReviewForABookingThatWasNeverApproved() {
        givenBooking(booking(BookingStatus.PENDING, LocalDate.of(2026, 6, 15), LocalTime.of(19, 0), FUTSAL_ID, USER_ID));

        ConflictException ex = assertThrows(ConflictException.class,
                () -> service.create(FUTSAL_ID, USER_ID, BOOKING_ID, 5, null));
        assertEquals("Only approved bookings can be reviewed.", ex.getMessage());
    }

    /** Reviewing venue B using a booking at venue A would let anyone rate anywhere. */
    @Test
    void rejectsAReviewWhoseBookingIsForADifferentVenue() {
        givenBooking(booking(BookingStatus.APPROVED, LocalDate.of(2026, 6, 15), LocalTime.of(19, 0), 99L, USER_ID));

        ConflictException ex = assertThrows(ConflictException.class,
                () -> service.create(FUTSAL_ID, USER_ID, BOOKING_ID, 5, null));
        assertEquals("This booking is not for the venue being reviewed.", ex.getMessage());
    }

    @Test
    void rejectsAReviewBeforeTheSlotHasFinished() {
        givenBooking(booking(BookingStatus.APPROVED, LocalDate.of(2026, 6, 16), LocalTime.of(19, 0), FUTSAL_ID, USER_ID));

        ConflictException ex = assertThrows(ConflictException.class,
                () -> service.create(FUTSAL_ID, USER_ID, BOOKING_ID, 5, null));
        assertEquals("You can review this booking after you have played.", ex.getMessage());
    }

    @Test
    void rejectsASecondReviewForTheSameBooking() {
        givenBooking(eligibleBooking());
        when(reviewRepository.existsByBooking_BookingId(BOOKING_ID)).thenReturn(true);

        ConflictException ex = assertThrows(ConflictException.class,
                () -> service.create(FUTSAL_ID, USER_ID, BOOKING_ID, 5, null));
        assertEquals("You have already reviewed this booking.", ex.getMessage());
    }

    @Test
    void ratingIsRoundedToOneDecimalPlace() {
        givenBooking(eligibleBooking());
        when(reviewRepository.countByFutsal_FutsalId(FUTSAL_ID)).thenReturn(3L);
        when(reviewRepository.averageRatingForFutsal(FUTSAL_ID)).thenReturn(4.6666);

        service.create(FUTSAL_ID, USER_ID, BOOKING_ID, 5, null);

        assertEquals(new BigDecimal("4.7"), futsal.getRating());
        assertEquals(3, futsal.getReviewCount());
    }

    @Test
    void removingTheLastReviewResetsTheVenueToUnrated() {
        when(reviewRepository.countByFutsal_FutsalId(FUTSAL_ID)).thenReturn(0L);
        when(reviewRepository.averageRatingForFutsal(FUTSAL_ID)).thenReturn(null);

        service.recalculateRating(FUTSAL_ID);

        assertEquals(BigDecimal.ZERO, futsal.getRating());
        assertEquals(0, futsal.getReviewCount());
    }
}
