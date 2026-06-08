package com.munichweekly.backend.service;

import com.munichweekly.backend.config.AnonymousVoteIdentityProperties;
import com.munichweekly.backend.exception.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;

@Service
public class AnonymousVoteIdentityService {

    public static final String COOKIE_NAME = "mw_vote_anon";

    private static final String TOKEN_VERSION = "1";
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String UNKNOWN_IP = "unknown";
    private static final int MIN_SECRET_LENGTH = 32;
    private static final int MAX_SUBJECT_LENGTH = 160;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();

    private final AnonymousVoteIdentityProperties properties;
    private final Clock clock;
    private final Supplier<String[]> activeProfilesSupplier;
    private final ConcurrentHashMap<String, Counter> tokenIssuanceCounters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Counter> voteAttemptCounters = new ConcurrentHashMap<>();
    private final AtomicReference<Instant> lastTokenIssuanceCleanup = new AtomicReference<>(Instant.EPOCH);
    private final AtomicReference<Instant> lastVoteAttemptCleanup = new AtomicReference<>(Instant.EPOCH);

    @Autowired
    public AnonymousVoteIdentityService(AnonymousVoteIdentityProperties properties, Environment environment) {
        this(properties, Clock.systemUTC(), environment::getActiveProfiles);
    }

    public AnonymousVoteIdentityService(
            AnonymousVoteIdentityProperties properties,
            Clock clock,
            Supplier<String[]> activeProfilesSupplier
    ) {
        this.properties = Objects.requireNonNull(properties, "properties");
        this.clock = Objects.requireNonNull(clock, "clock");
        this.activeProfilesSupplier = Objects.requireNonNull(activeProfilesSupplier, "activeProfilesSupplier");
        validateSecretForProduction();
    }

    public Resolution resolveOrIssue(
            String signedCookie,
            String legacyVisitorId,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        requireConfiguredSecret();

        TokenPayload verified = verify(signedCookie);
        if (verified != null) {
            return new Resolution(verified.subject(), IdentitySource.SIGNED_COOKIE);
        }

        checkAndRecordTokenIssuance(request);

        String legacySubject = cleanLegacyVisitorId(legacyVisitorId);
        if (!hasSignedCookie(signedCookie) && legacySubject != null) {
            issueCookie(legacySubject, request, response);
            return new Resolution(legacySubject, IdentitySource.LEGACY_MIGRATION);
        }

        String subject = generateSubject();
        issueCookie(subject, request, response);
        return new Resolution(subject, IdentitySource.NEW_COOKIE);
    }

    public Optional<Resolution> resolveExistingOrMigrate(
            String signedCookie,
            String legacyVisitorId,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        requireConfiguredSecret();

        TokenPayload verified = verify(signedCookie);
        if (verified != null) {
            return Optional.of(new Resolution(verified.subject(), IdentitySource.SIGNED_COOKIE));
        }

        String legacySubject = cleanLegacyVisitorId(legacyVisitorId);
        if (!hasSignedCookie(signedCookie) && legacySubject != null) {
            checkAndRecordTokenIssuance(request);
            issueCookie(legacySubject, request, response);
            return Optional.of(new Resolution(legacySubject, IdentitySource.LEGACY_MIGRATION));
        }

        return Optional.empty();
    }

    public void checkAndRecordAnonymousVoteAttempt(Long submissionId, HttpServletRequest request) {
        Instant now = clock.instant();
        Duration window = voteAttemptWindow();
        cleanupExpired(voteAttemptCounters, now, window, lastVoteAttemptCleanup);
        String key = "vote:" + remoteAddress(request) + ":" + submissionId;
        checkAndRecord(voteAttemptCounters, key, maxVoteAttemptCount(), window, now);
    }

    public String createTokenForTest(String subject, Instant issuedAt) {
        return createToken(subject, issuedAt);
    }

    private void validateSecretForProduction() {
        if (isProductionProfile() && configuredSecret().isEmpty()) {
            throw new IllegalStateException("ANONYMOUS_VOTE_SECRET must be configured in production.");
        }
        if (!configuredSecret().isEmpty() && configuredSecret().length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("ANONYMOUS_VOTE_SECRET must be at least 32 characters.");
        }
    }

    private void requireConfiguredSecret() {
        if (configuredSecret().isEmpty()) {
            throw new IllegalStateException("Anonymous voting is not configured. Set ANONYMOUS_VOTE_SECRET.");
        }
        if (configuredSecret().length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("ANONYMOUS_VOTE_SECRET must be at least 32 characters.");
        }
    }

    private boolean isProductionProfile() {
        return Arrays.stream(activeProfilesSupplier.get())
                .anyMatch(profile -> profile != null && profile.startsWith("prod"));
    }

    private String configuredSecret() {
        String secret = properties.getSecret();
        return secret == null ? "" : secret.trim();
    }

    private TokenPayload verify(String signedCookie) {
        if (!hasSignedCookie(signedCookie)) {
            return null;
        }

        String[] parts = signedCookie.split("\\.");
        if (parts.length != 4 || !TOKEN_VERSION.equals(parts[0])) {
            return null;
        }

        String signingInput = parts[0] + "." + parts[1] + "." + parts[2];
        byte[] expectedSignature = sign(signingInput);
        byte[] actualSignature;
        try {
            actualSignature = BASE64_URL_DECODER.decode(parts[3]);
        } catch (IllegalArgumentException ex) {
            return null;
        }
        if (!MessageDigest.isEqual(expectedSignature, actualSignature)) {
            return null;
        }

        String subject;
        long issuedAtEpochSeconds;
        try {
            subject = new String(BASE64_URL_DECODER.decode(parts[1]), StandardCharsets.UTF_8);
            issuedAtEpochSeconds = Long.parseLong(parts[2]);
        } catch (IllegalArgumentException ex) {
            return null;
        }

        if (!isValidSubject(subject) || issuedAtEpochSeconds <= 0) {
            return null;
        }

        return new TokenPayload(subject, Instant.ofEpochSecond(issuedAtEpochSeconds));
    }

    private void issueCookie(String subject, HttpServletRequest request, HttpServletResponse response) {
        if (response == null) {
            return;
        }
        String token = createToken(subject, clock.instant());
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(shouldUseSecureCookie(request))
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofSeconds(Math.max(60, properties.getCookieMaxAgeSeconds())))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String createToken(String subject, Instant issuedAt) {
        if (!isValidSubject(subject)) {
            throw new IllegalArgumentException("Invalid anonymous vote subject.");
        }
        String encodedSubject = BASE64_URL_ENCODER.encodeToString(subject.getBytes(StandardCharsets.UTF_8));
        String signingInput = TOKEN_VERSION + "." + encodedSubject + "." + issuedAt.getEpochSecond();
        return signingInput + "." + BASE64_URL_ENCODER.encodeToString(sign(signingInput));
    }

    private byte[] sign(String signingInput) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(configuredSecret().getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Unable to sign anonymous vote identity.", ex);
        }
    }

    private boolean shouldUseSecureCookie(HttpServletRequest request) {
        return properties.isCookieSecure() || isProductionProfile() || (request != null && request.isSecure());
    }

    private void checkAndRecordTokenIssuance(HttpServletRequest request) {
        Instant now = clock.instant();
        Duration window = tokenIssuanceWindow();
        cleanupExpired(tokenIssuanceCounters, now, window, lastTokenIssuanceCleanup);
        String key = "token:" + remoteAddress(request);
        checkAndRecord(tokenIssuanceCounters, key, maxTokenIssuanceCount(), window, now);
    }

    private static void checkAndRecord(
            ConcurrentHashMap<String, Counter> counters,
            String key,
            int maxAttempts,
            Duration window,
            Instant now
    ) {
        counters.compute(key, (ignored, counter) -> {
            if (counter == null || counter.isExpired(now, window)) {
                return Counter.started(now);
            }
            if (counter.count() >= maxAttempts) {
                throw new RateLimitExceededException(counter.retryAfterSeconds(now, window));
            }
            return counter.increment();
        });
    }

    private static void cleanupExpired(
            ConcurrentHashMap<String, Counter> counters,
            Instant now,
            Duration window,
            AtomicReference<Instant> lastCleanup
    ) {
        Instant last = lastCleanup.get();
        if (last.plus(cleanupInterval(window)).isAfter(now)) {
            return;
        }
        if (!lastCleanup.compareAndSet(last, now)) {
            return;
        }
        counters.forEach((key, counter) -> {
            if (counter.isExpired(now, window)) {
                counters.remove(key, counter);
            }
        });
    }

    private static Duration cleanupInterval(Duration window) {
        long seconds = Math.min(60, Math.max(1, window.toSeconds()));
        return Duration.ofSeconds(seconds);
    }

    private String generateSubject() {
        byte[] random = new byte[32];
        SECURE_RANDOM.nextBytes(random);
        return "anon_" + BASE64_URL_ENCODER.encodeToString(random);
    }

    private static String cleanLegacyVisitorId(String legacyVisitorId) {
        if (legacyVisitorId == null) {
            return null;
        }
        String trimmed = legacyVisitorId.trim();
        if (!isValidSubject(trimmed)) {
            return null;
        }
        return trimmed;
    }

    private static boolean hasSignedCookie(String signedCookie) {
        return signedCookie != null && !signedCookie.isBlank();
    }

    private static boolean isValidSubject(String subject) {
        return subject != null
                && !subject.isBlank()
                && subject.length() <= MAX_SUBJECT_LENGTH
                && !subject.contains("\r")
                && !subject.contains("\n")
                && !subject.regionMatches(true, 0, "user_", 0, "user_".length())
                && subject.chars().allMatch(ch -> ch >= 33 && ch <= 126);
    }

    private int maxTokenIssuanceCount() {
        return Math.max(1, properties.getTokenIssuanceMaxAttempts());
    }

    private Duration tokenIssuanceWindow() {
        return Duration.ofSeconds(Math.max(1, properties.getTokenIssuanceWindowSeconds()));
    }

    private int maxVoteAttemptCount() {
        return Math.max(1, properties.getVoteAttemptMaxAttempts());
    }

    private Duration voteAttemptWindow() {
        return Duration.ofSeconds(Math.max(1, properties.getVoteAttemptWindowSeconds()));
    }

    private static String remoteAddress(HttpServletRequest request) {
        if (request == null || request.getRemoteAddr() == null || request.getRemoteAddr().isBlank()) {
            return UNKNOWN_IP;
        }
        String directRemoteAddress = request.getRemoteAddr().trim();
        if (isTrustedProxyAddress(directRemoteAddress)) {
            String forwardedAddress = forwardedAddress(request);
            if (forwardedAddress != null) {
                return forwardedAddress;
            }
        }
        return directRemoteAddress;
    }

    private static String forwardedAddress(HttpServletRequest request) {
        String realIp = cleanForwardedAddress(request.getHeader("X-Real-IP"));
        if (realIp != null) {
            return realIp;
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return null;
        }
        String[] parts = forwardedFor.split(",");
        for (int i = parts.length - 1; i >= 0; i--) {
            String candidate = cleanForwardedAddress(parts[i]);
            if (candidate != null) {
                return candidate;
            }
        }
        return null;
    }

    private static String cleanForwardedAddress(String address) {
        if (address == null) {
            return null;
        }
        String trimmed = address.trim();
        if (trimmed.isEmpty()
                || trimmed.length() > 128
                || "unknown".equalsIgnoreCase(trimmed)
                || trimmed.contains("\r")
                || trimmed.contains("\n")) {
            return null;
        }
        return trimmed;
    }

    private static boolean isTrustedProxyAddress(String address) {
        return "127.0.0.1".equals(address)
                || "::1".equals(address)
                || "0:0:0:0:0:0:0:1".equals(address)
                || address.startsWith("10.")
                || address.startsWith("192.168.")
                || isPrivate172Address(address);
    }

    private static boolean isPrivate172Address(String address) {
        String[] parts = address.split("\\.");
        if (parts.length != 4 || !"172".equals(parts[0])) {
            return false;
        }
        try {
            int secondOctet = Integer.parseInt(parts[1]);
            return secondOctet >= 16 && secondOctet <= 31;
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    public enum IdentitySource {
        SIGNED_COOKIE,
        LEGACY_MIGRATION,
        NEW_COOKIE
    }

    public record Resolution(String subject, IdentitySource source) {
    }

    private record TokenPayload(String subject, Instant issuedAt) {
    }

    private record Counter(int count, Instant windowStartedAt) {

        private static Counter started(Instant now) {
            return new Counter(1, now);
        }

        private Counter increment() {
            return new Counter(count + 1, windowStartedAt);
        }

        private boolean isExpired(Instant now, Duration window) {
            return !windowStartedAt.plus(window).isAfter(now);
        }

        private long retryAfterSeconds(Instant now, Duration window) {
            return Math.max(1, Duration.between(now, windowStartedAt.plus(window)).toSeconds());
        }
    }
}
