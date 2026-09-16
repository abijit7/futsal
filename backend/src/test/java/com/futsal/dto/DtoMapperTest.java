package com.futsal.dto;

import com.futsal.model.Booking;
import com.futsal.model.BookingStatusHistory;
import com.futsal.model.Futsal;
import com.futsal.model.FutsalImage;
import com.futsal.model.TimeSlot;
import com.futsal.model.User;
import com.futsal.model.enums.BookingStatus;
import com.futsal.model.enums.PaymentMethod;
import com.futsal.model.enums.Role;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DtoMapperTest {

    @Test
    void mapsFutsalRequestToEntityIncludingOperationalFields() {
        FutsalRequest request = new FutsalRequest();
        request.setName("Prime Arena");
        request.setAddress("Mid Baneshwor");
        request.setCity("Kathmandu");
        request.setPhone("9812345678");
        request.setHourlyPrice(new BigDecimal("1800"));
        request.setOpeningTime(LocalTime.of(6, 0));
        request.setClosingTime(LocalTime.of(22, 0));
        request.setImageUrl("/uploads/cover.jpg");
        request.setImageUrls(List.of("/uploads/cover.jpg", "/uploads/side.jpg"));
        request.setCourtType("Indoor turf");
        request.setDescription("Parking available");

        Futsal futsal = DtoMapper.toFutsal(request);

        assertEquals("Prime Arena", futsal.getName());
        assertEquals(LocalTime.of(6, 0), futsal.getOpeningTime());
        assertEquals(LocalTime.of(22, 0), futsal.getClosingTime());
        assertEquals(List.of("/uploads/cover.jpg", "/uploads/side.jpg"), futsal.getImageUrls());
        assertEquals("Indoor turf", futsal.getCourtType());
    }

    /**
     * A venue must not be able to declare itself approved or well-reviewed.
     *
     * <p>FutsalRequest carries no verified/rating/reviewCount fields at all, so this asserts the
     * mapper leaves the entity on its own defaults - an unapproved venue with no reputation - no
     * matter what the caller sent. Before this, all three were mapped straight through, which was
     * harmless only for as long as admins were the sole callers.
     */
    @Test
    void doesNotLetTheRequestSetVerificationOrReputation() {
        FutsalRequest request = new FutsalRequest();
        request.setName("Prime Arena");
        request.setOpeningTime(LocalTime.of(6, 0));
        request.setClosingTime(LocalTime.of(22, 0));

        Futsal futsal = DtoMapper.toFutsal(request);

        assertFalse(futsal.isVerified(), "a mapped venue must start unapproved");
        assertNull(futsal.getRating(), "rating is an aggregate, never a request field");
        assertEquals(0, futsal.getReviewCount(), "reviewCount is an aggregate, never a request field");
    }

    @Test
    void mapsFutsalResponseWithOrderedImagesAndMetadata() {
        Futsal futsal = futsal();
        futsal.setImageUrl("/uploads/cover.jpg");
        futsal.getImages().add(new FutsalImage(futsal, "/uploads/cover.jpg", 0, true));
        futsal.getImages().add(new FutsalImage(futsal, "/uploads/side.jpg", 1, false));

        FutsalResponse response = DtoMapper.toFutsalResponse(futsal);

        assertEquals(7L, response.getFutsalId());
        assertEquals(LocalTime.of(22, 0), response.getClosingTime());
        assertEquals(List.of("/uploads/cover.jpg", "/uploads/side.jpg"), response.getImageUrls());
        assertEquals(2, response.getImages().size());
        assertTrue(response.getImages().get(0).isCover());
        assertFalse(response.getImages().get(1).isCover());
    }

    @Test
    void mapsBookingResponseWithoutLeakingUserPassword() {
        User user = new User("Test User", "player@gmail.com", "9812345678", "hashed", Role.USER);
        user.setUserId(3L);
        TimeSlot slot = new TimeSlot(futsal(), LocalDate.of(2026, 6, 15), LocalTime.of(18, 0), LocalTime.of(19, 0));
        slot.setSlotId(11L);
        Booking booking = new Booking(user, slot, "Bring ball", PaymentMethod.ESEWA, "ESEWA-1");
        booking.setBookingId(99L);
        booking.addStatusHistory(new BookingStatusHistory(booking, BookingStatus.PENDING, "user:3", "Booking created"));

        BookingResponse response = DtoMapper.toBookingResponse(booking);

        assertEquals(99L, response.getBookingId());
        assertEquals("Test User", response.getUser().getName());
        assertEquals("player@gmail.com", response.getUser().getEmail());
        assertEquals(11L, response.getTimeSlot().getSlotId());
        assertEquals("Prime Arena", response.getTimeSlot().getFutsal().getName());
        assertEquals(1, response.getStatusHistory().size());
    }

    @Test
    void nullInputsReturnNull() {
        assertNull(DtoMapper.toFutsal(null));
        assertNull(DtoMapper.toTimeSlot(null));
        assertNull(DtoMapper.toUser(null));
        assertNull(DtoMapper.toFutsalResponse(null));
        assertNull(DtoMapper.toBookingResponse(null));
    }

    private Futsal futsal() {
        Futsal futsal = new Futsal("Prime Arena", "Mid Baneshwor", "Kathmandu", "9812345678", new BigDecimal("1800"), LocalTime.of(6, 0), null, "Parking available");
        futsal.setFutsalId(7L);
        futsal.setClosingTime(LocalTime.of(22, 0));
        futsal.setVerified(true);
        futsal.setCourtType("Indoor turf");
        futsal.setRating(new BigDecimal("4.7"));
        futsal.setReviewCount(18);
        return futsal;
    }
}
