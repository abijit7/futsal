package com.futsal.repository;

import com.futsal.model.User;
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
}
