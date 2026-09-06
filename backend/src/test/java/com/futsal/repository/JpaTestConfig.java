package com.futsal.repository;

import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * The configuration the repository tests boot against.
 *
 * <p>{@code @DataJpaTest} otherwise walks up to {@code FutsalApplication}, which declares beans such
 * as the admin bootstrap that depend on services a JPA slice does not create. Living in this package
 * means it is found first, so the tests get the entities and repositories and nothing else.
 */
@SpringBootConfiguration
@EnableAutoConfiguration
@EntityScan("com.futsal.model")
@EnableJpaRepositories("com.futsal.repository")
class JpaTestConfig {
}
