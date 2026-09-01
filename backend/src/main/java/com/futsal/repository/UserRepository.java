package com.futsal.repository;

import com.futsal.model.User;
import com.futsal.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query("""
        select u from User u
        where :query is null
           or :query = ''
           or lower(u.name) like lower(concat('%', :query, '%'))
           or lower(u.email) like lower(concat('%', :query, '%'))
           or lower(u.phone) like lower(concat('%', :query, '%'))
           or lower(cast(u.role as string)) like lower(concat('%', :query, '%'))
        """)
    Page<User> search(@Param("query") String query, Pageable pageable);

    /**
     * Same search, restricted to one role. Kept as a separate method rather than an
     * `:role is null` branch, which Hibernate cannot always type-infer for an enum parameter.
     */
    @Query("""
        select u from User u
        where u.role = :role
          and (:query is null
           or :query = ''
           or lower(u.name) like lower(concat('%', :query, '%'))
           or lower(u.email) like lower(concat('%', :query, '%'))
           or lower(u.phone) like lower(concat('%', :query, '%')))
        """)
    Page<User> searchByRole(@Param("query") String query, @Param("role") Role role, Pageable pageable);
}
