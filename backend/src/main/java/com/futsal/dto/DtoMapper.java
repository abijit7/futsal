package com.futsal.dto;

import com.futsal.model.Booking;
import com.futsal.model.Futsal;
import com.futsal.model.TimeSlot;
import com.futsal.model.User;

public class DtoMapper {

    private DtoMapper() {
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
        dto.setImageUrl(futsal.getImageUrl());
        dto.setImageUrls(futsal.getImageUrls());
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
        return dto;
    }
}
