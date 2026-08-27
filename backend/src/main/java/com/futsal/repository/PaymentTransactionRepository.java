package com.futsal.repository;

import com.futsal.model.Booking;
import com.futsal.model.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
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
}
