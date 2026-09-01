package com.futsal.repository;

import com.futsal.model.User;
import com.futsal.model.VerificationCode;
import com.futsal.model.enums.VerificationPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    Optional<VerificationCode> findFirstByUserAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(
            User user,
            VerificationPurpose purpose
    );

    List<VerificationCode> findByUserAndPurposeAndConsumedAtIsNull(User user, VerificationPurpose purpose);

    @Modifying
    @Transactional
    void deleteByUser(User user);
}
