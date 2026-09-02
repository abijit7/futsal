package com.futsal.controller;

import com.futsal.dto.DtoMapper;
import com.futsal.dto.PagedResponse;
import com.futsal.dto.ReviewRequest;
import com.futsal.dto.ReviewResponse;
import com.futsal.model.Review;
import com.futsal.security.SecurityAuth;
import com.futsal.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewService reviewService;
    private final SecurityAuth securityAuth;

    public ReviewController(ReviewService reviewService, SecurityAuth securityAuth) {
        this.reviewService = reviewService;
        this.securityAuth = securityAuth;
    }

    /** Public: reviews are what a prospective customer comes to read. */
    @GetMapping("/futsals/{futsalId}/reviews")
    public ResponseEntity<PagedResponse<ReviewResponse>> listForFutsal(
            @PathVariable Long futsalId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequestFactory.create(page, size);
        Page<ReviewResponse> result = reviewService.listForFutsal(futsalId, pageable)
                .map(DtoMapper::toReviewResponse);
        return ResponseEntity.ok(PagedResponse.fromPage(result));
    }

    /** Ownership of the booking is enforced in the service. */
    @PostMapping("/futsals/{futsalId}/reviews")
    public ResponseEntity<ReviewResponse> create(@PathVariable Long futsalId,
                                                 @Valid @RequestBody ReviewRequest body) {
        Long userId = securityAuth.currentUser().userId();
        Review review = reviewService.create(
                futsalId, userId, body.getBookingId(), body.getRating(), body.getComment());
        return ResponseEntity.ok(DtoMapper.toReviewResponse(review));
    }

    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ReviewResponse> update(@PathVariable Long reviewId,
                                                 @Valid @RequestBody ReviewRequest body) {
        Review review = reviewService.update(reviewId, body.getRating(), body.getComment());
        return ResponseEntity.ok(DtoMapper.toReviewResponse(review));
    }

    /** Authors may retract their own review; admins may remove any, as moderation. */
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> delete(@PathVariable Long reviewId) {
        reviewService.delete(reviewId);
        return ResponseEntity.noContent().build();
    }

    /** Lets "My bookings" show a review prompt only where one is still possible. */
    @GetMapping("/users/{userId}/reviewed-bookings")
    public ResponseEntity<List<Long>> reviewedBookings(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.reviewedBookingIds(userId));
    }
}
