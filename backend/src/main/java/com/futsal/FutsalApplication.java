package com.futsal;

import com.futsal.model.User;
import com.futsal.repository.UserRepository;
import com.futsal.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class FutsalApplication {
    public static void main(String[] args) {
        SpringApplication.run(FutsalApplication.class, args);
    }

    // Bootstrap an admin account on startup for development convenience.
    // Reads ADMIN_EMAIL and ADMIN_PASS from environment variables. If not set,
    // defaults to admin@example.com / admin123. Only creates the account if no
    // user with that email exists.
    @Bean
    public CommandLineRunner seedAdmin(UserRepository userRepository, UserService userService) {
        return args -> {
            String adminEmail = System.getenv().getOrDefault("ADMIN_EMAIL", "admin@gmail.com");
            String adminPass  = System.getenv().getOrDefault("ADMIN_PASS", "admin123");

            if (!userRepository.existsByEmail(adminEmail)) {
                User admin = new User();
                admin.setName("Admin role");
                admin.setEmail(adminEmail);
                admin.setPassword(userService.hashPassword(adminPass));
                admin.setPhone("9818100273");
                admin.setRole(com.futsal.model.enums.Role.ADMIN);
                userRepository.save(admin);
                System.out.println("[BOOTSTRAP] Admin user created: " + adminEmail);
            } else {
                System.out.println("[BOOTSTRAP] Admin user already exists: " + adminEmail);
            }
        };
    }
}
