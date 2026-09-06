package com.futsal.service;

import com.futsal.config.DemoProperties;
import com.futsal.dto.SlotGenerationRequest;
import com.futsal.dto.SlotGenerationResponse;
import com.futsal.model.Futsal;
import com.futsal.model.User;
import com.futsal.model.enums.Role;
import com.futsal.repository.FutsalRepository;
import com.futsal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The demo seed runs on every start and then on a timer, so the property that matters is that a
 * second run changes nothing: no duplicated venues, no re-hashed passwords, and no reset of an
 * account that is already exactly as advertised.
 */
class DemoDataServiceTest {

    private static final String ADMIN_EMAIL = "admin@merofutsal.local";
    private static final String USER_EMAIL = "player@merofutsal.local";

    private final Clock clock = Clock.fixed(Instant.parse("2026-06-20T04:00:00Z"), ZoneId.of("UTC"));

    private UserRepository userRepository;
    private FutsalRepository futsalRepository;
    private TimeSlotService timeSlotService;
    private UserService userService;
    private DemoDataService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        futsalRepository = mock(FutsalRepository.class);
        timeSlotService = mock(TimeSlotService.class);
        userService = new UserService();

        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(futsalRepository.findFirstByNameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(futsalRepository.save(any(Futsal.class))).thenAnswer(invocation -> {
            Futsal futsal = invocation.getArgument(0);
            futsal.setFutsalId(1L);
            return futsal;
        });
        when(timeSlotService.generateSlots(any())).thenReturn(new SlotGenerationResponse(0, 0, 0));

        service = new DemoDataService(properties(), userRepository, futsalRepository,
                timeSlotService, userService, clock);
    }

    @Test
    void seedsBothAccountsWithHashedPasswordsAndTheAdvertisedRoles() {
        service.seed();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(2)).save(saved.capture());

        User admin = saved.getAllValues().get(0);
        assertThat(admin.getEmail()).isEqualTo(ADMIN_EMAIL);
        assertThat(admin.getRole()).isEqualTo(Role.ADMIN);
        assertThat(admin.isEmailVerified()).isTrue();
        assertThat(admin.getPassword()).isNotEqualTo("DemoAdmin123");
        assertThat(userService.verifyPassword("DemoAdmin123", admin.getPassword())).isTrue();

        User player = saved.getAllValues().get(1);
        assertThat(player.getEmail()).isEqualTo(USER_EMAIL);
        assertThat(player.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void leavesAnAlreadyCorrectAccountUntouched() {
        when(userRepository.findByEmailIgnoreCase(ADMIN_EMAIL)).thenReturn(Optional.of(existingAdmin()));

        service.seed();

        // Only the customer account is written; the admin already matched the advertised state.
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void restoresAnAccountWhoseRoleOrPasswordDrifted() {
        User drifted = existingAdmin();
        drifted.setRole(Role.USER);
        drifted.setPassword(userService.hashPassword("something-else"));
        when(userRepository.findByEmailIgnoreCase(ADMIN_EMAIL)).thenReturn(Optional.of(drifted));

        service.seed();

        assertThat(drifted.getRole()).isEqualTo(Role.ADMIN);
        assertThat(userService.verifyPassword("DemoAdmin123", drifted.getPassword())).isTrue();
        // Tokens minted against the old password must not survive the reset.
        assertThat(drifted.getAuthVersion()).isEqualTo(4);
    }

    @Test
    void doesNotRecreateVenuesThatAreAlreadyThere() {
        when(futsalRepository.findFirstByNameIgnoreCase(anyString()))
                .thenReturn(Optional.of(existingVenue()));

        service.seed();

        verify(futsalRepository, never()).save(any(Futsal.class));
    }

    @Test
    void generatesSlotsForTheConfiguredWindowStartingToday() {
        service.seed();

        ArgumentCaptor<SlotGenerationRequest> request =
                ArgumentCaptor.forClass(SlotGenerationRequest.class);
        verify(timeSlotService, times(3)).generateSlots(request.capture());

        SlotGenerationRequest first = request.getAllValues().get(0);
        assertThat(first.getStartDate()).isEqualTo(LocalDate.of(2026, 6, 20));
        assertThat(first.getEndDate()).isEqualTo(LocalDate.of(2026, 6, 22));
        assertThat(first.getSlotMinutes()).isEqualTo(60);
    }

    private DemoProperties properties() {
        DemoProperties properties = new DemoProperties();
        properties.setEnabled(true);
        properties.setSlotDays(3);
        properties.setSlotMinutes(60);
        properties.getAdmin().setName("Demo Admin");
        properties.getAdmin().setEmail(ADMIN_EMAIL);
        properties.getAdmin().setPhone("9800000001");
        properties.getAdmin().setPassword("DemoAdmin123");
        properties.getUser().setName("Demo Player");
        properties.getUser().setEmail(USER_EMAIL);
        properties.getUser().setPhone("9800000002");
        properties.getUser().setPassword("DemoPlayer123");
        return properties;
    }

    private User existingAdmin() {
        User user = new User();
        user.setUserId(7L);
        user.setName("Demo Admin");
        user.setEmail(ADMIN_EMAIL);
        user.setPhone("9800000001");
        user.setPassword(userService.hashPassword("DemoAdmin123"));
        user.setRole(Role.ADMIN);
        user.setEmailVerified(true);
        user.setPhoneVerified(true);
        user.setAuthVersion(3);
        return user;
    }

    private Futsal existingVenue() {
        Futsal futsal = new Futsal();
        futsal.setFutsalId(4L);
        futsal.setName("Kathmandu Futsal Arena");
        futsal.setHourlyPrice(new BigDecimal("1200.00"));
        futsal.setOpeningTime(LocalTime.of(6, 0));
        futsal.setClosingTime(LocalTime.of(22, 0));
        return futsal;
    }

    /** Guards the shape the login screen relies on: exactly one admin and one customer. */
    @Test
    void seedsExactlyOneAdminAndOneCustomer() {
        service.seed();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(2)).save(saved.capture());
        List<Role> roles = saved.getAllValues().stream().map(User::getRole).toList();
        assertThat(roles).containsExactly(Role.ADMIN, Role.USER);
    }
}
