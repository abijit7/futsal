package com.futsal.service;

import com.futsal.config.DemoProperties;
import com.futsal.error.ConflictException;
import com.futsal.model.User;
import com.futsal.model.enums.Role;
import com.futsal.repository.BookingRepository;
import com.futsal.repository.UserRepository;
import com.futsal.repository.VerificationCodeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceTest {

    private final BCryptPasswordEncoder verifier = new BCryptPasswordEncoder();

    @Test
    void hashPasswordUsesBCrypt() {
        UserService userService = new UserService();

        String encoded = userService.hashPassword("secret123");

        assertTrue(encoded.startsWith("$2"));
        assertTrue(verifier.matches("secret123", encoded));
        assertNotEquals(legacySha256("secret123"), encoded);
    }

    @Test
    void loginMigratesLegacySha256PasswordToBCrypt() {
        User user = new User();
        user.setUserId(7L);
        user.setName("Test User");
        user.setEmail("player@gmail.com");
        user.setPhone("9812345678");
        user.setRole(Role.USER);
        user.setPassword(legacySha256("secret123"));

        AtomicBoolean savedPassword = new AtomicBoolean(false);
        UserRepository userRepository = repositoryReturning(user, savedPassword);
        UserService userService = new UserService();
        ReflectionTestUtils.setField(userService, "userRepository", userRepository);

        User loggedIn = userService.login("player@gmail.com", "secret123");

        assertTrue(savedPassword.get());
        assertTrue(verifier.matches("secret123", loggedIn.getPassword()));
        assertTrue(verifier.matches("secret123", user.getPassword()));
    }

    private UserRepository repositoryReturning(User user, AtomicBoolean savedPassword) {
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if ("findByEmailIgnoreCase".equals(method.getName())) {
                        return Optional.of(user);
                    }
                    if ("save".equals(method.getName())) {
                        savedPassword.set(true);
                        User saved = (User) args[0];
                        User copy = new User();
                        copy.setUserId(saved.getUserId());
                        copy.setName(saved.getName());
                        copy.setEmail(saved.getEmail());
                        copy.setPhone(saved.getPhone());
                        copy.setRole(saved.getRole());
                        copy.setPassword(saved.getPassword());
                        return copy;
                    }
                    throw new UnsupportedOperationException(method.getName());
                }
        );
    }

    // ── Demo account protection ──────────────────────────────────────────────
    //
    // Demo mode publishes a working admin login to anyone who visits. Without these guards one
    // visitor could change that password, or delete the account, and lock every later visitor out
    // until the next seed.

    private static final String DEMO_ADMIN_EMAIL = "admin@merofutsal.local";

    @Test
    void refusesToChangeTheDemoAccountPassword() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = demoAwareService(userRepository, true);
        User demoAdmin = demoAdmin();
        when(userRepository.findById(4L)).thenReturn(Optional.of(demoAdmin));

        ConflictException thrown = assertThrows(ConflictException.class,
                () -> userService.changePassword(4L, "DemoAdmin123", "hijacked123"));

        assertTrue(thrown.getMessage().contains("shared demo account"));
        assertTrue(verifier.matches("DemoAdmin123", demoAdmin.getPassword()));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void refusesToDeleteTheDemoAccount() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = demoAwareService(userRepository, true);
        when(userRepository.findById(4L)).thenReturn(Optional.of(demoAdmin()));

        assertThrows(ConflictException.class, () -> userService.deleteUser(4L));

        verify(userRepository, never()).delete(any(User.class));
    }

    /** The guard is scoped to the two advertised logins; every other account behaves normally. */
    @Test
    void leavesOrdinaryAccountsAloneWhileDemoModeIsOn() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = demoAwareService(userRepository, true);
        User ordinary = demoAdmin();
        ordinary.setEmail("someone@example.com");
        when(userRepository.findById(9L)).thenReturn(Optional.of(ordinary));

        assertDoesNotThrow(() -> userService.changePassword(9L, "DemoAdmin123", "brand-new-pass"));

        assertTrue(verifier.matches("brand-new-pass", ordinary.getPassword()));
    }

    /** Off a demo deployment the accounts are ordinary rows and nothing is protected. */
    @Test
    void appliesNoGuardWhenDemoModeIsOff() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = demoAwareService(userRepository, false);
        User demoAdmin = demoAdmin();
        when(userRepository.findById(4L)).thenReturn(Optional.of(demoAdmin));

        assertDoesNotThrow(() -> userService.changePassword(4L, "DemoAdmin123", "brand-new-pass"));

        assertTrue(verifier.matches("brand-new-pass", demoAdmin.getPassword()));
    }

    // ── Deleting a user with history ─────────────────────────────────────────

    /**
     * The booking foreign key has no ON DELETE CASCADE, so without this the delete failed at the
     * database with nothing but a constraint name to explain it. The rows it would have taken -
     * bookings and their payments - are financial records that should outlive the account.
     */
    @Test
    void refusesToDeleteAUserWhoHasBookings() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = serviceWithBookings(userRepository, 3L);

        User customer = ordinaryUser();
        when(userRepository.findById(9L)).thenReturn(Optional.of(customer));

        ConflictException ex = assertThrows(ConflictException.class, () -> userService.deleteUser(9L));
        assertTrue(ex.getMessage().contains("3 booking(s)"), "the count belongs in the message");
        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void deletesAUserWhoHasNoBookings() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = serviceWithBookings(userRepository, 0L);

        User customer = ordinaryUser();
        when(userRepository.findById(9L)).thenReturn(Optional.of(customer));

        assertDoesNotThrow(() -> userService.deleteUser(9L));
        verify(userRepository).delete(customer);
    }

    /** A demo account is refused as a demo account, not for happening to have bookings. */
    @Test
    void theDemoGuardStillRunsBeforeTheBookingGuard() {
        UserRepository userRepository = mock(UserRepository.class);
        UserService userService = serviceWithBookings(userRepository, 3L);
        ReflectionTestUtils.setField(userService, "demoProperties", enabledDemo());

        when(userRepository.findById(4L)).thenReturn(Optional.of(demoAdmin()));

        ConflictException ex = assertThrows(ConflictException.class, () -> userService.deleteUser(4L));
        assertTrue(ex.getMessage().contains("shared demo account"));
    }

    private UserService serviceWithBookings(UserRepository userRepository, long bookingCount) {
        BookingRepository bookings = mock(BookingRepository.class);
        when(bookings.countByUser(any(User.class))).thenReturn(bookingCount);

        UserService userService = new UserService();
        ReflectionTestUtils.setField(userService, "userRepository", userRepository);
        ReflectionTestUtils.setField(userService, "verificationCodeRepository",
                mock(VerificationCodeRepository.class));
        ReflectionTestUtils.setField(userService, "bookingRepository", bookings);
        return userService;
    }

    private DemoProperties enabledDemo() {
        DemoProperties demo = new DemoProperties();
        demo.setEnabled(true);
        demo.getAdmin().setEmail(DEMO_ADMIN_EMAIL);
        demo.getUser().setEmail("player@merofutsal.local");
        return demo;
    }

    private User ordinaryUser() {
        User user = new User();
        user.setUserId(9L);
        user.setName("Ordinary Customer");
        user.setEmail("customer@example.com");
        user.setRole(Role.USER);
        return user;
    }

    private UserService demoAwareService(UserRepository userRepository, boolean demoEnabled) {
        DemoProperties demo = new DemoProperties();
        demo.setEnabled(demoEnabled);
        demo.getAdmin().setEmail(DEMO_ADMIN_EMAIL);
        demo.getUser().setEmail("player@merofutsal.local");

        UserService userService = new UserService();
        ReflectionTestUtils.setField(userService, "userRepository", userRepository);
        ReflectionTestUtils.setField(userService, "verificationCodeRepository",
                mock(VerificationCodeRepository.class));
        ReflectionTestUtils.setField(userService, "demoProperties", demo);
        return userService;
    }

    private User demoAdmin() {
        User user = new User();
        user.setUserId(4L);
        user.setName("Demo Admin");
        user.setEmail(DEMO_ADMIN_EMAIL);
        user.setPhone("9800000001");
        user.setRole(Role.ADMIN);
        user.setPassword(new BCryptPasswordEncoder().encode("DemoAdmin123"));
        return user;
    }

    private String legacySha256(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
