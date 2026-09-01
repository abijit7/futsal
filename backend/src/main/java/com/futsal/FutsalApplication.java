package com.futsal;

import com.futsal.model.User;
import com.futsal.model.enums.Role;
import com.futsal.repository.UserRepository;
import com.futsal.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // drives PaymentGatewayService.releaseExpiredHolds
public class FutsalApplication {
    private static final Logger log = LoggerFactory.getLogger(FutsalApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(FutsalApplication.class, args);
    }

    // Bootstrap an admin account only when credentials are explicitly configured.
    @Bean
    public CommandLineRunner seedAdmin(UserRepository userRepository, UserService userService) {
        return args -> {
            String adminEmail = System.getenv("ADMIN_EMAIL");
            String adminPass  = System.getenv("ADMIN_PASS");

            if (adminEmail == null || adminEmail.isBlank() || adminPass == null || adminPass.isBlank()) {
                log.info("Admin bootstrap skipped because ADMIN_EMAIL or ADMIN_PASS is not configured.");
                return;
            }

            userRepository.findByEmail(adminEmail).ifPresentOrElse(existing -> {
                boolean changed = false;
                if (existing.getRole() != Role.ADMIN) {
                    existing.setRole(Role.ADMIN);
                    changed = true;
                }
                if (!userService.verifyPassword(adminPass, existing.getPassword())) {
                    existing.setPassword(userService.hashPassword(adminPass));
                    changed = true;
                }
                if (changed) {
                    userRepository.save(existing);
                    log.info("Admin bootstrap updated configured admin user.");
                } else {
                    log.info("Admin bootstrap found existing configured admin user.");
                }
            }, () -> {
                User admin = new User();
                admin.setName("Admin role");
                admin.setEmail(adminEmail);
                admin.setPassword(userService.hashPassword(adminPass));
                admin.setPhone("9818100273");
                admin.setRole(Role.ADMIN);
                userRepository.save(admin);
                log.info("Admin bootstrap created configured admin user.");
            });
        };
    }
}
