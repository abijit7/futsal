package com.futsal.service;

import com.futsal.model.Futsal;
import com.futsal.model.FutsalImage;
import com.futsal.repository.BookingRepository;
import com.futsal.repository.FutsalRepository;
import com.futsal.repository.TimeSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class FutsalService {

    @Autowired
    private FutsalRepository futsalRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TimeSlotRepository timeSlotRepository;

    public Page<Futsal> getAll(String query, String sort, Pageable pageable) {
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                resolveSort(sort)
        );
        return futsalRepository.findAll(searchSpec(query), sortedPageable);
    }

    public Futsal getById(Long id) {
        return futsalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Futsal not found with ID: " + id));
    }

    public Futsal add(Futsal futsal) {
        validateSchedule(futsal);
        syncImages(futsal, futsal);
        return futsalRepository.save(futsal);
    }

    public Futsal update(Long id, Futsal updated) {
        Futsal existing = getById(id);
        existing.setName(updated.getName());
        existing.setAddress(updated.getAddress());
        existing.setCity(updated.getCity());
        existing.setPhone(updated.getPhone());
        existing.setHourlyPrice(updated.getHourlyPrice());
        existing.setOpeningTime(updated.getOpeningTime());
        existing.setClosingTime(updated.getClosingTime());
        existing.setVerified(updated.isVerified());
        existing.setCourtType(updated.getCourtType());
        existing.setRating(updated.getRating());
        existing.setReviewCount(updated.getReviewCount());
        validateSchedule(existing);
        syncImages(existing, updated);
        existing.setDescription(updated.getDescription());
        return futsalRepository.save(existing);
    }

    private void validateSchedule(Futsal futsal) {
        if (futsal.getOpeningTime() == null || futsal.getClosingTime() == null) {
            throw new RuntimeException("Opening and closing times are required.");
        }
        if (futsal.getReviewCount() == null) {
            futsal.setReviewCount(0);
        }
        if (!futsal.getClosingTime().isAfter(futsal.getOpeningTime())) {
            throw new RuntimeException("Closing time must be after opening time.");
        }
    }

    private Sort resolveSort(String sort) {
        if ("price-low".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.asc("hourlyPrice"), Sort.Order.asc("name"));
        }
        if ("price-high".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.desc("hourlyPrice"), Sort.Order.asc("name"));
        }
        return Sort.by(
                Sort.Order.desc("verified"),
                Sort.Order.desc("rating").nullsLast(),
                Sort.Order.desc("reviewCount"),
                Sort.Order.asc("name")
        );
    }

    private Specification<Futsal> searchSpec(String query) {
        String term = query == null ? "" : query.trim().toLowerCase();
        if (term.isBlank()) {
            return null;
        }
        return (root, criteriaQuery, criteriaBuilder) -> {
            String pattern = "%" + term + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("address")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("city")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("courtType")), pattern)
            );
        };
    }

    private void syncImages(Futsal target, Futsal source) {
        List<String> urls = source.getImageUrls();
        String single = source.getImageUrl();
        List<String> resolved = new ArrayList<>();

        if (urls != null && !urls.isEmpty()) {
            resolved.addAll(urls);
        } else if (single != null && !single.isBlank()) {
            resolved.add(single);
        }

        target.getImages().clear();
        int order = 0;
        for (String url : resolved) {
            if (url == null || url.isBlank()) {
                continue;
            }
            boolean cover = order == 0;
            FutsalImage image = new FutsalImage(target, url.trim(), order, cover);
            target.getImages().add(image);
            order++;
        }

        if (!target.getImages().isEmpty()) {
            target.setImageUrl(target.getImages().get(0).getImageUrl());
        } else {
            target.setImageUrl(null);
        }
    }

    @Transactional
    public void delete(Long id) {
        Futsal futsal = futsalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Futsal not found"));
        timeSlotRepository.findByFutsalIdForUpdate(id);
        if (bookingRepository.existsByTimeSlot_Futsal_FutsalIdAndStatusNotIn(id, BookingService.CLOSED_STATUSES)) {
            throw new RuntimeException("Cannot delete a futsal with active bookings.");
        }
        if (bookingRepository.existsByTimeSlot_Futsal_FutsalId(id)) {
            throw new RuntimeException("Cannot delete a futsal with booking history. Add an archive flow before deleting historical futsals.");
        }
        futsalRepository.delete(futsal);
    }
}
