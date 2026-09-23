package com.futsal.service;

import com.futsal.dto.UserUpdateRequest;
import com.futsal.error.ConflictException;
import com.futsal.error.NotFoundException;
import com.futsal.model.User;
import com.futsal.model.enums.Role;
import com.futsal.repository.BookingRepository;
import com.futsal.repository.UserRepository;
import com.futsal.repository.VerificationCodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder(12);

    /**
     * RFC 2606 / RFC 6761 names reserved so they can never resolve. Registration promises a
     * verification email, so an address here is one the account could never confirm.
     */
    private static final List<String> RESERVED_EMAIL_DOMAINS = List.of("example.com", "example.net", "example.org");
    private static final Set<String> RESERVED_EMAIL_TLDS = Set.of("test", "example", "invalid", "localhost", "local");

    private static final List<String> DISPOSABLE_EMAIL_DOMAINS = List.of(
            "10minutemail.com", "discard.email", "dispostable.com", "emailondeck.com", "fakeinbox.com",
            "getairmail.com", "getnada.com", "guerrillamail.com", "mailcatch.com", "maildrop.cc",
            "mailinator.com", "mailnesia.com", "mohmal.com", "moakt.com", "sharklasers.com",
            "spam4.me", "spamgourmet.com", "temp-mail.org", "tempmail.com", "tempmailo.com",
            "throwawaymail.com", "trashmail.com", "yopmail.com", "yopmail.net");

    /**
     * Base words behind the passwords that top every breach list, plus the ones this product
     * invites by name. Matched lowercased and again with trailing digits stripped, so one entry
     * covers {@code password}, {@code Password1} and {@code password2024}. Kept in step with
     * {@code frontend/src/utils/validation.ts}.
     */
    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "abc", "abcd", "abcdef", "admin", "administrator", "asdfgh", "baseball", "batman",
            "changeme", "computer", "cricket", "dragon", "facebook", "football", "freedom", "futsal",
            "google", "hello", "helloworld", "iloveyou", "internet", "jordan", "kathmandu", "letmein",
            "login", "master", "merofutsal", "michael", "monkey", "nepal", "passw0rd", "password",
            "princess", "qwerty", "qwertyuiop", "samsung", "secret", "shadow", "sunshine", "superman",
            "test", "testing", "trustno", "welcome", "whatever", "zxcvbn");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationCodeRepository verificationCodeRepository;

    /** Only to guard deletion. Optional for the same reason as above: the unit tests build this
     * service with {@code new UserService()}. */
    @Autowired(required = false)
    private BookingRepository bookingRepository;

    // ── Hash password using BCrypt ────────────────────────────────────────────
    public String hashPassword(String password) {
        return PASSWORD_ENCODER.encode(password);
    }

    public boolean verifyPassword(String rawPassword, String storedPassword) {
        return passwordMatches(rawPassword, storedPassword);
    }

    // ── Register new user ─────────────────────────────────────────────────────
    public User register(User user) {
        user.setEmail(normalizeEmail(user.getEmail()));
        rejectUnusableEmailDomain(user.getEmail());
        rejectWeakPassword(user.getPassword(), user.getName(), user.getEmail());
        if (userRepository.existsByEmailIgnoreCase(user.getEmail())) {
            throw new ConflictException("Email is already registered. Please use a different email.");
        }
        user.setPassword(hashPassword(user.getPassword()));
        user.setRole(Role.USER);
        user.setEmailVerified(false);
        user.setPhoneVerified(false);
        user.setAuthVersion(0);
        return userRepository.save(user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public User login(String email, String password) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email."));

        if (!passwordMatches(password, user.getPassword())) {
            throw new IllegalArgumentException("Incorrect password. Please try again.");
        }
        if (!isBcryptHash(user.getPassword())) {
            user.setPassword(hashPassword(password));
            user = userRepository.save(user);
        }
        return user;
    }

    // ── Get all users (admin) ─────────────────────────────────────────────────
    public Page<User> getAllUsers(String query, Pageable pageable) {
        return getAllUsers(query, null, pageable);
    }

    public Page<User> getAllUsers(String query, Role role, Pageable pageable) {
        String term = query == null ? "" : query.trim();
        return role == null
                ? userRepository.search(term, pageable)
                : userRepository.searchByRole(term, role, pageable);
    }

    // ── Get user by ID ────────────────────────────────────────────────────────
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    // ── Update user profile ───────────────────────────────────────────────────
    public User updateUser(Long id, UserUpdateRequest updatedUser) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (updatedUser.getName() != null && !updatedUser.getName().isBlank()) {
            existing.setName(updatedUser.getName());
        }
        if (updatedUser.getPhone() != null && !updatedUser.getPhone().isBlank()) {
            if (!updatedUser.getPhone().equals(existing.getPhone())) {
                existing.setPhoneVerified(false);
            }
            existing.setPhone(updatedUser.getPhone());
        }
        return userRepository.save(existing);
    }

    public void changePassword(Long id, String currentPassword, String newPassword) {
        User existing = getUserById(id);
        if (!passwordMatches(currentPassword, existing.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (passwordMatches(newPassword, existing.getPassword())) {
            throw new IllegalArgumentException("New password must be different from the current password");
        }
        setNewPassword(existing, newPassword);
    }

    public void resetPassword(User user, String newPassword) {
        setNewPassword(user, newPassword);
    }

    private void setNewPassword(User user, String newPassword) {
        user.setPassword(hashPassword(newPassword));
        user.setAuthVersion(user.getAuthVersion() + 1);
        userRepository.save(user);
    }

    // ── Delete user (admin) ───────────────────────────────────────────────────
    // Transactional because deleteByUser is a derived delete query: Spring Data's default
    // read-only transaction cannot execute it, and the two deletes must succeed or fail together.
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        rejectIfUserHasBookings(user);
        verificationCodeRepository.deleteByUser(user);
        userRepository.delete(user);
    }

    /**
     * Refuses to delete a user who has booking history, the way FutsalService.delete refuses a
     * venue that has one.
     *
     * <p>Two reasons. The booking foreign key has no {@code ON DELETE CASCADE}, so the delete would
     * fail at the database anyway with nothing but a constraint name to explain it. And the rows it
     * would take with it - bookings and their payment transactions - are financial records that
     * should outlive the account.
     *
     * <p>It also closes a quieter problem: the review foreign key <em>does</em> cascade, so deleting
     * a user would have silently removed their reviews and left the venue's rating and review count
     * counting reviews that no longer existed. A review requires a booking, so this guard makes that
     * unreachable.
     */
    private void rejectIfUserHasBookings(User user) {
        if (bookingRepository == null) {
            return;
        }
        long bookings = bookingRepository.countByUser(user);
        if (bookings > 0) {
            throw new ConflictException(
                    "This user has " + bookings + " booking(s) and cannot be deleted. "
                            + "Cancel or delete those bookings first.");
        }
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }
        if (isBcryptHash(storedPassword)) {
            return PASSWORD_ENCODER.matches(rawPassword, storedPassword);
        }
        return storedPassword.equals(legacySha256(rawPassword));
    }

    private boolean isBcryptHash(String password) {
        return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$");
    }

    private String legacySha256(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Hashing error", e);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    // ── Registration guards ───────────────────────────────────────────────────
    // The bean validation on UserRegisterRequest covers shape and length. These two cover the
    // list lookups an annotation cannot express, and are the reason a caller cannot skip the form
    // and POST a throwaway address or "12345678" straight at the endpoint. Messages match the
    // frontend's word for word so both surfaces read the same.

    /** Expects an already-normalized (trimmed, lowercased) address. */
    private void rejectUnusableEmailDomain(String email) {
        int at = email.lastIndexOf('@');
        if (at < 0) {
            return;
        }
        String domain = email.substring(at + 1);
        String tld = domain.substring(domain.lastIndexOf('.') + 1);
        if (matchesDomain(domain, RESERVED_EMAIL_DOMAINS) || RESERVED_EMAIL_TLDS.contains(tld)) {
            throw new IllegalArgumentException(
                    domain + " is a reserved test domain. Use an address you can actually receive mail at.");
        }
        if (matchesDomain(domain, DISPOSABLE_EMAIL_DOMAINS)) {
            throw new IllegalArgumentException(
                    "Disposable email addresses aren't accepted - you'll need this address to verify the account.");
        }
    }

    /** True when {@code domain} is a listed name itself or a subdomain of one. */
    private boolean matchesDomain(String domain, List<String> list) {
        return list.stream().anyMatch(entry -> domain.equals(entry) || domain.endsWith("." + entry));
    }

    private void rejectWeakPassword(String password, String name, String email) {
        if (password == null) {
            return;
        }
        if (isRun(password)) {
            throw new IllegalArgumentException("That's a sequence, not a password. Mix it up.");
        }
        if (isCommonPassword(password)) {
            throw new IllegalArgumentException("That password is too common. Pick something harder to guess.");
        }
        if (reusesPersonalDetails(password, name, email)) {
            throw new IllegalArgumentException("Don't use your name or email address in your password.");
        }
    }

    /**
     * Catches the whole-string runs a blocklist would never keep up with: {@code 12345678},
     * {@code 87654321}, {@code abcdefgh}, {@code aaaaaaaa}.
     */
    private boolean isRun(String value) {
        if (value.length() < 3) {
            return false;
        }
        boolean ascending = true;
        boolean descending = true;
        boolean repeated = true;
        for (int i = 1; i < value.length(); i++) {
            int step = value.charAt(i) - value.charAt(i - 1);
            if (step != 1) ascending = false;
            if (step != -1) descending = false;
            if (step != 0) repeated = false;
        }
        return ascending || descending || repeated;
    }

    private boolean isCommonPassword(String password) {
        String lowered = password.toLowerCase();
        if (COMMON_PASSWORDS.contains(lowered)) {
            return true;
        }
        String withoutTrailingDigits = lowered.replaceAll("\\d+$", "");
        return withoutTrailingDigits.length() >= 3 && COMMON_PASSWORDS.contains(withoutTrailingDigits);
    }

    /** Name words and the email local part, long enough that finding them in a password is telling. */
    private boolean reusesPersonalDetails(String password, String name, String email) {
        String lowered = password.toLowerCase();
        String local = email == null ? "" : email.split("@")[0];
        String[] tokens = (name == null ? "" : name).toLowerCase().trim().split("\\s+");
        for (String token : tokens) {
            if (token.length() >= 4 && lowered.contains(token)) {
                return true;
            }
        }
        return local.length() >= 4 && lowered.contains(local.toLowerCase());
    }
}
