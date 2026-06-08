package com.munichweekly.backend.service;

import com.munichweekly.backend.config.AuthRateLimitProperties;
import com.munichweekly.backend.exception.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class AuthRateLimitService {

    private static final String UNKNOWN_IP = "unknown";

    private final AuthRateLimitProperties properties;
    private final Clock clock;
    private final ConcurrentHashMap<String, Counter> loginFailures = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Counter> passwordResetAttempts = new ConcurrentHashMap<>();
    private final AtomicReference<Instant> lastLoginCleanup = new AtomicReference<>(Instant.EPOCH);
    private final AtomicReference<Instant> lastPasswordResetCleanup = new AtomicReference<>(Instant.EPOCH);

    @Autowired
    public AuthRateLimitService(AuthRateLimitProperties properties) {
        this(properties, Clock.systemUTC());
    }

    public AuthRateLimitService(AuthRateLimitProperties properties, Clock clock) {
        this.properties = Objects.requireNonNull(properties, "properties");
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    public void checkLoginAllowed(String email, HttpServletRequest request) {
        Instant now = clock.instant();
        AuthRateLimitProperties.Limit limit = properties.getLogin();
        Duration window = window(limit);
        cleanupExpired(loginFailures, now, window, lastLoginCleanup);
        String key = key("login", email, request);

        Counter counter = loginFailures.get(key);
        if (counter == null) {
            return;
        }
        if (counter.isExpired(now, window)) {
            loginFailures.remove(key, counter);
            return;
        }
        if (counter.count() >= maxAttempts(limit)) {
            throw new RateLimitExceededException(counter.retryAfterSeconds(now, window));
        }
    }

    public void recordLoginFailure(String email, HttpServletRequest request) {
        Instant now = clock.instant();
        Duration window = window(properties.getLogin());
        cleanupExpired(loginFailures, now, window, lastLoginCleanup);
        loginFailures.compute(key("login", email, request), (ignored, counter) -> {
            if (counter == null || counter.isExpired(now, window)) {
                return Counter.started(now);
            }
            return counter.increment(now);
        });
    }

    public void clearLoginFailures(String email, HttpServletRequest request) {
        loginFailures.remove(key("login", email, request));
    }

    public void checkAndRecordPasswordReset(String email, HttpServletRequest request) {
        Instant now = clock.instant();
        AuthRateLimitProperties.PasswordResetLimit limit = properties.getPasswordReset();
        Duration window = window(limit);
        Duration cooldown = Duration.ofSeconds(Math.max(0, limit.getCooldownSeconds()));
        cleanupExpired(passwordResetAttempts, now, window, lastPasswordResetCleanup);

        passwordResetAttempts.compute(key("password-reset", email, request), (ignored, counter) -> {
            if (counter == null || counter.isExpired(now, window)) {
                return Counter.started(now);
            }
            if (counter.count() >= maxAttempts(limit)) {
                throw new RateLimitExceededException(counter.retryAfterSeconds(now, window));
            }
            if (!cooldown.isZero() && counter.isWithinCooldown(now, cooldown)) {
                throw new RateLimitExceededException(counter.cooldownRetryAfterSeconds(now, cooldown));
            }
            return counter.increment(now);
        });
    }

    private static int maxAttempts(AuthRateLimitProperties.Limit limit) {
        return Math.max(1, limit.getMaxAttempts());
    }

    private static Duration window(AuthRateLimitProperties.Limit limit) {
        return Duration.ofSeconds(Math.max(1, limit.getWindowSeconds()));
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

    private static String key(String action, String email, HttpServletRequest request) {
        return action + ":" + remoteAddress(request) + ":" + normalizeEmail(email);
    }

    private static String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
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

    private record Counter(int count, Instant windowStartedAt, Instant lastAttemptAt) {

        private static Counter started(Instant now) {
            return new Counter(1, now, now);
        }

        private Counter increment(Instant now) {
            return new Counter(count + 1, windowStartedAt, now);
        }

        private boolean isExpired(Instant now, Duration window) {
            return !windowStartedAt.plus(window).isAfter(now);
        }

        private boolean isWithinCooldown(Instant now, Duration cooldown) {
            return lastAttemptAt.plus(cooldown).isAfter(now);
        }

        private long retryAfterSeconds(Instant now, Duration window) {
            return Math.max(1, Duration.between(now, windowStartedAt.plus(window)).toSeconds());
        }

        private long cooldownRetryAfterSeconds(Instant now, Duration cooldown) {
            return Math.max(1, Duration.between(now, lastAttemptAt.plus(cooldown)).toSeconds());
        }
    }
}
