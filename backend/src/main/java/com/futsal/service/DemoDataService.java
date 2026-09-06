package com.futsal.service;

import com.futsal.config.DemoProperties;
import com.futsal.dto.SlotGenerationRequest;
import com.futsal.model.Futsal;
import com.futsal.model.User;
import com.futsal.model.enums.Role;
import com.futsal.repository.FutsalRepository;
import com.futsal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Keeps the demo looking like a working venue: two known logins, a few venues, and a rolling
 * window of bookable slots.
 *
 * <p>Every operation is idempotent, because {@link com.futsal.config.DemoDataSeeder} runs this on
 * every start and then on a timer. The timer is not just repair - it rolls the slot window forward,
 * without which an always-on demo runs out of bookable slots after {@code app.demo.slot-days}.
 *
 * <p>What it deliberately does <em>not</em> do is reset visitor-created data. Venues and accounts a
 * visitor adds are theirs to keep; only the seeded venues and the two advertised logins are
 * maintained.
 */
@Service
public class DemoDataService {

    private static final Logger log = LoggerFactory.getLogger(DemoDataService.class);

    private final DemoProperties demo;
    private final UserRepository userRepository;
    private final FutsalRepository futsalRepository;
    private final TimeSlotService timeSlotService;
    private final UserService userService;
    private final Clock clock;

    public DemoDataService(DemoProperties demo,
                           UserRepository userRepository,
                           FutsalRepository futsalRepository,
                           TimeSlotService timeSlotService,
                           UserService userService,
                           Clock clock) {
        this.demo = demo;
        this.userRepository = userRepository;
        this.futsalRepository = futsalRepository;
        this.timeSlotService = timeSlotService;
        this.userService = userService;
        this.clock = clock;
    }

    @Transactional
    public void seed() {
        seedAccount(demo.getAdmin(), Role.ADMIN);
        seedAccount(demo.getUser(), Role.USER);
        for (Futsal venue : seedVenues()) {
            generateSlots(venue);
        }
    }

    // ── Accounts ─────────────────────────────────────────────────────────────

    /**
     * Makes one account match what {@code GET /api/demo} advertises.
     *
     * <p>An account that already matches is left completely alone - no save, no re-hash - because
     * this runs every few hours and rewriting a row on each pass would be pure churn. Name and
     * phone are excluded from that comparison on purpose: editing the demo profile is one of the
     * things a visitor is invited to try, and the next sweep should not fight them over it.
     */
    private void seedAccount(DemoProperties.Account advertised, Role role) {
        String email = advertised.getEmail();
        User existing = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (existing == null) {
            User created = new User(
                    advertised.getName(),
                    email,
                    advertised.getPhone(),
                    userService.hashPassword(advertised.getPassword()),
                    role);
            // Verified so the demo skips a verification step that needs a real mailbox.
            created.setEmailVerified(true);
            created.setPhoneVerified(true);
            userRepository.save(created);
            log.info("Demo account created: {} ({})", email, role);
            return;
        }

        boolean passwordDrifted = !userService.verifyPassword(advertised.getPassword(), existing.getPassword());
        boolean roleDrifted = existing.getRole() != role;
        if (!passwordDrifted && !roleDrifted && existing.isEmailVerified()) {
            return;
        }

        if (passwordDrifted) {
            existing.setPassword(userService.hashPassword(advertised.getPassword()));
        }
        existing.setRole(role);
        existing.setEmailVerified(true);
        // Tokens minted before the restore carry the old password or the old role, so retire them.
        existing.setAuthVersion(existing.getAuthVersion() + 1);
        userRepository.save(existing);
        log.info("Demo account restored: {} ({})", email, role);
    }

    // ── Venues and slots ─────────────────────────────────────────────────────

    /**
     * Returns the seeded venues, creating any that are missing.
     *
     * <p>Matched by name via {@code findFirstByNameIgnoreCase} rather than by a stored id, so the
     * seeder still recognises its own venues after the database is rebuilt from scratch.
     */
    private List<Futsal> seedVenues() {
        return List.of(
                venue("Kathmandu Futsal Arena", "Battisputali Road", "Kathmandu", "9800100001",
                        new BigDecimal("1200.00"), LocalTime.of(6, 0), LocalTime.of(22, 0), "Indoor",
                        "Covered indoor court with floodlights, changing rooms and free parking."),
                venue("Lalitpur Sports Hub", "Jhamsikhel", "Lalitpur", "9800100002",
                        new BigDecimal("1500.00"), LocalTime.of(7, 0), LocalTime.of(21, 0), "Outdoor",
                        "Full-size outdoor turf beside the ring road, popular for weekend leagues."),
                venue("Bhaktapur Turf Park", "Suryabinayak", "Bhaktapur", "9800100003",
                        new BigDecimal("900.00"), LocalTime.of(6, 0), LocalTime.of(20, 0), "Outdoor",
                        "Budget-friendly turf with two five-a-side pitches and a small canteen."));
    }

    private Futsal venue(String name, String address, String city, String phone, BigDecimal hourlyPrice,
                         LocalTime opening, LocalTime closing, String courtType, String description) {
        Futsal existing = futsalRepository.findFirstByNameIgnoreCase(name).orElse(null);
        if (existing != null) {
            return existing;
        }
        // No image: imageForVenue() on the frontend falls back to a bundled placeholder, and the
        // deployed CSP allows no external image host.
        Futsal created = new Futsal(name, address, city, phone, hourlyPrice, opening, null, description);
        created.setClosingTime(closing);
        created.setCourtType(courtType);
        created.setVerified(true);
        Futsal saved = futsalRepository.save(created);
        log.info("Demo venue created: {}", name);
        return saved;
    }

    /**
     * Tops the venue up to {@code app.demo.slot-days} of bookable slots from today.
     *
     * <p>Runs for every venue on every sweep, not only for newly created ones: that is what moves
     * the window forward. {@link TimeSlotService#generateSlots} skips slots that already exist, so
     * repeating this is cheap and creates no duplicates.
     */
    private void generateSlots(Futsal venue) {
        SlotGenerationRequest request = new SlotGenerationRequest();
        request.setFutsalId(venue.getFutsalId());
        LocalDate today = LocalDate.now(clock);
        request.setStartDate(today);
        // At least today: a misconfigured slot-days of 0 would otherwise put the end date before
        // the start date and fail generation on every sweep.
        request.setEndDate(today.plusDays(Math.max(1, demo.getSlotDays()) - 1L));
        request.setSlotMinutes(demo.getSlotMinutes());
        // Start and end times left null so each venue's own opening hours apply.
        timeSlotService.generateSlots(request);
    }
}
