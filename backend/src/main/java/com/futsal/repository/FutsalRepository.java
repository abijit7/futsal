package com.futsal.repository;

import com.futsal.model.Futsal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FutsalRepository extends JpaRepository<Futsal, Long>, JpaSpecificationExecutor<Futsal> {

    /**
     * Used by the demo seeder to recognise a venue it already created. Deliberately "findFirst":
     * venue names are not unique, and an operator adding a second venue with the same name must
     * not turn the seeder's lookup into an exception.
     */
    Optional<Futsal> findFirstByNameIgnoreCase(String name);
}
