package com.futsal.dto;

import com.futsal.model.Booking;
import com.futsal.model.BookingStatusHistory;
import com.futsal.model.Futsal;
import com.futsal.model.FutsalImage;
import com.futsal.model.Review;
import com.futsal.model.TimeSlot;
import com.futsal.model.TimeSlotStatusHistory;
import com.futsal.model.User;

public class DtoMapper {

    private DtoMapper() {
    }

    public static Futsal toFutsal(FutsalRequest request) {
        if (request == null) {
            return null;
        }
        Futsal futsal = new Futsal();
        futsal.setName(request.getName());
        futsal.setAddress(request.getAddress());
        futsal.setCity(request.getCity());
        futsal.setPhone(request.getPhone());
        futsal.setHourlyPrice(request.getHourlyPrice());
        futsal.setOpeningTime(request.getOpeningTime());
        futsal.setClosingTime(request.getClosingTime());
        futsal.setImageUrl(request.getImageUrl());
        futsal.setImageUrls(request.getImageUrls());
        futsal.setVerified(request.isVerified());
        futsal.setCourtType(request.getCourtType());
        futsal.setRating(request.getRating());
        futsal.setReviewCount(request.getReviewCount());
        futsal.setDescription(request.getDescription());
        return futsal;
    }

    public static TimeSlot toTimeSlot(SlotRequest request) {
        if (request == null) {
            return null;
        }
        TimeSlot slot = new TimeSlot();
        slot.setSlotDate(request.getSlotDate());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        if (request.getAvailable() != null) {
            slot.setAvailable(request.getAvailable());
        }
        return slot;
    }

    public static User toUser(UserRegisterRequest request) {
        if (request == null) {
            return null;
        }
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(request.getPassword());
        return user;
    }

    public static FutsalResponse toFutsalResponse(Futsal futsal) {
        if (futsal == null) {
            return null;
        }
        FutsalResponse dto = new FutsalResponse();
        dto.setFutsalId(futsal.getFutsalId());
        dto.setName(futsal.getName());
        dto.setAddress(futsal.getAddress());
        dto.setCity(futsal.getCity());
        dto.setPhone(futsal.getPhone());
        dto.setHourlyPrice(futsal.getHourlyPrice());
        dto.setOpeningTime(futsal.getOpeningTime());
        dto.setClosingTime(futsal.getClosingTime());
        dto.setImageUrl(futsal.getImageUrl());
        dto.setImageUrls(futsal.getImageUrls());
        dto.setVerified(futsal.isVerified());
        dto.setCourtType(futsal.getCourtType());
        dto.setRating(futsal.getRating());
        dto.setReviewCount(futsal.getReviewCount());
        if (futsal.getImages() != null) {
            dto.setImages(futsal.getImages().stream().map(DtoMapper::toFutsalImageResponse).toList());
        }
        dto.setDescription(futsal.getDescription());
        dto.setCreatedAt(futsal.getCreatedAt());
        return dto;
    }

    public static FutsalSummary toFutsalSummary(Futsal futsal) {
        if (futsal == null) {
            return null;
        }
        FutsalSummary dto = new FutsalSummary();
        dto.setFutsalId(futsal.getFutsalId());
        dto.setName(futsal.getName());
        dto.setHourlyPrice(futsal.getHourlyPrice());
        return dto;
    }

    public static TimeSlotResponse toTimeSlotResponse(TimeSlot slot) {
        if (slot == null) {
            return null;
        }
        TimeSlotResponse dto = new TimeSlotResponse();
        dto.setSlotId(slot.getSlotId());
        dto.setSlotDate(slot.getSlotDate());
        dto.setStartTime(slot.getStartTime());
        dto.setEndTime(slot.getEndTime());
        dto.setAvailable(slot.isAvailable());
        dto.setFutsal(toFutsalSummary(slot.getFutsal()));
        if (slot.getStatusHistory() != null) {
            dto.setStatusHistory(slot.getStatusHistory().stream().map(DtoMapper::toTimeSlotStatusHistoryResponse).toList());
        }
        return dto;
    }

    public static TimeSlotSummary toTimeSlotSummary(TimeSlot slot) {
        if (slot == null) {
            return null;
        }
        TimeSlotSummary dto = new TimeSlotSummary();
        dto.setSlotId(slot.getSlotId());
        dto.setSlotDate(slot.getSlotDate());
        dto.setStartTime(slot.getStartTime());
        dto.setEndTime(slot.getEndTime());
        dto.setAvailable(slot.isAvailable());
        dto.setFutsal(toFutsalSummary(slot.getFutsal()));
        return dto;
    }

    public static UserResponse toUserResponse(User user) {
        if (user == null) {
            return null;
        }
        UserResponse dto = new UserResponse();
        dto.setUserId(user.getUserId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setPhoneVerified(user.isPhoneVerified());
        return dto;
    }

    public static UserSummary toUserSummary(User user) {
        if (user == null) {
            return null;
        }
        UserSummary dto = new UserSummary();
        dto.setUserId(user.getUserId());
        dto.setName(user.getName());
        dto.setPhone(user.getPhone());
        dto.setEmail(user.getEmail());
        return dto;
    }

    public static BookingResponse toBookingResponse(Booking booking) {
        if (booking == null) {
            return null;
        }
        BookingResponse dto = new BookingResponse();
        dto.setBookingId(booking.getBookingId());
        dto.setStatus(booking.getStatus());
        dto.setPaymentMethod(booking.getPaymentMethod());
        dto.setPaymentRef(booking.getPaymentRef());
        dto.setPaidAt(booking.getPaidAt());
        dto.setBookedAt(booking.getBookedAt());
        dto.setNotes(booking.getNotes());
        dto.setUser(toUserSummary(booking.getUser()));
        dto.setTimeSlot(toTimeSlotSummary(booking.getTimeSlot()));
        if (booking.getStatusHistory() != null) {
            dto.setStatusHistory(booking.getStatusHistory().stream().map(DtoMapper::toBookingStatusHistoryResponse).toList());
        }
        return dto;
    }

    public static ReviewResponse toReviewResponse(Review review) {
        if (review == null) {
            return null;
        }
        ReviewResponse dto = new ReviewResponse();
        dto.setReviewId(review.getReviewId());
        dto.setFutsalId(review.getFutsal() == null ? null : review.getFutsal().getFutsalId());
        dto.setBookingId(review.getBooking() == null ? null : review.getBooking().getBookingId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setUpdatedAt(review.getUpdatedAt());
        if (review.getUser() != null) {
            dto.setAuthorId(review.getUser().getUserId());
            dto.setAuthorName(review.getUser().getName());
        }
        return dto;
    }

    public static FutsalImageResponse toFutsalImageResponse(FutsalImage image) {
        if (image == null) {
            return null;
        }
        FutsalImageResponse dto = new FutsalImageResponse();
        dto.setImageId(image.getImageId());
        dto.setImageUrl(image.getImageUrl());
        dto.setSortOrder(image.getSortOrder());
        dto.setCover(image.isCover());
        dto.setCaption(image.getCaption());
        dto.setCreatedAt(image.getCreatedAt());
        return dto;
    }

    public static BookingStatusHistoryResponse toBookingStatusHistoryResponse(BookingStatusHistory history) {
        if (history == null) {
            return null;
        }
        BookingStatusHistoryResponse dto = new BookingStatusHistoryResponse();
        dto.setStatus(history.getStatus());
        dto.setChangedAt(history.getChangedAt());
        dto.setChangedBy(history.getChangedBy());
        dto.setNote(history.getNote());
        return dto;
    }

    public static TimeSlotStatusHistoryResponse toTimeSlotStatusHistoryResponse(TimeSlotStatusHistory history) {
        if (history == null) {
            return null;
        }
        TimeSlotStatusHistoryResponse dto = new TimeSlotStatusHistoryResponse();
        dto.setAvailable(history.isAvailable());
        dto.setChangedAt(history.getChangedAt());
        dto.setChangedBy(history.getChangedBy());
        dto.setNote(history.getNote());
        return dto;
    }
}
