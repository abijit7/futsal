package com.futsal.repository;

import com.futsal.model.Booking;
import com.futsal.model.PaymentTransaction;
import com.futsal.model.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByIdempotencyKey(String idempotencyKey);

    Optional<PaymentTransaction> findByGatewayTransactionId(String gatewayTransactionId);

    Optional<PaymentTransaction> findByBooking(Booking booking);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentTransaction p where p.transactionId = :transactionId")
    Optional<PaymentTransaction> findByIdForUpdate(@Param("transactionId") Long transactionId);

    boolean existsByIdempotencyKey(String idempotencyKey);

    /** Abandoned checkouts: still PENDING after the gateway's payment link has expired. */
    List<PaymentTransaction> findByStatusAndCreatedAtBefore(PaymentStatus status, LocalDateTime cutoff);

    /** Drives the refund reconciliation sweep. */
    List<PaymentTransaction> findByStatus(PaymentStatus status);

    /** Drives the admin refund queue: longest-outstanding first. */
    Page<PaymentTransaction> findByStatusOrderByRefundDueAtAsc(PaymentStatus status, Pageable pageable);
}
