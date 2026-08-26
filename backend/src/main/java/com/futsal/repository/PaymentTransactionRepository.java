package com.futsal.repository;

import com.futsal.model.Booking;
import com.futsal.model.PaymentTransaction;
import com.futsal.model.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByIdempotencyKey(String idempotencyKey);

    Optional<PaymentTransaction> findByGatewayTransactionId(String gatewayTransactionId);

    Optional<PaymentTransaction> findByBooking(Booking booking);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PaymentTransaction> findByIdForUpdate(Long id);

    boolean existsByIdempotencyKey(String idempotencyKey);
}
