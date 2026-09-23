package com.futsal.repository;

import com.futsal.model.Futsal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FutsalRepository extends JpaRepository<Futsal, Long>, JpaSpecificationExecutor<Futsal> {
}
