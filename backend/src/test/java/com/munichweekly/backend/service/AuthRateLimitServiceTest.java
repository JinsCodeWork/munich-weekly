package com.munichweekly.backend.service;

import com.munichweekly.backend.config.AuthRateLimitProperties;
import com.munichweekly.backend.exception.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthRateLimitServiceTest {

    @Test
    void loginFailureLimitUsesNormalizedEmailAndRemoteAddress() {
        MutableClock clock = new MutableClock();
        AuthRateLimitService service = new AuthRateLimitService(properties(2, 900, 3, 3600, 0), clock);
        HttpServletRequest request = request("203.0.113.10");

        service.checkLoginAllowed("USER@example.com", request);
        service.recordLoginFailure(" USER@example.com ", request);
        service.checkLoginAllowed("user@example.com", request);
        service.recordLoginFailure("user@example.com", request);

        assertThatThrownBy(() -> service.checkLoginAllowed(" user@example.com ", request))
                .isInstanceOf(RateLimitExceededException.class);

        clock.advance(Duration.ofSeconds(901));

        assertThatCode(() -> service.checkLoginAllowed("user@example.com", request))
                .doesNotThrowAnyException();
    }

    @Test
    void differentIpOrEmailHaveIndependentLoginCounters() {
        AuthRateLimitService service = new AuthRateLimitService(properties(1, 900, 3, 3600, 0), new MutableClock());

        service.recordLoginFailure("user@example.com", request("203.0.113.10"));

        assertThatCode(() -> service.checkLoginAllowed("other@example.com", request("203.0.113.10")))
                .doesNotThrowAnyException();
        assertThatCode(() -> service.checkLoginAllowed("user@example.com", request("203.0.113.11")))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> service.checkLoginAllowed("user@example.com", request("203.0.113.10")))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void trustedProxyRealIpSeparatesLoginCounters() {
        AuthRateLimitService service = new AuthRateLimitService(properties(1, 900, 3, 3600, 0), new MutableClock());

        service.recordLoginFailure("user@example.com", proxiedRequest("127.0.0.1", "198.51.100.10", null));

        assertThatThrownBy(() -> service.checkLoginAllowed(
                "user@example.com",
                proxiedRequest("127.0.0.1", "198.51.100.10", null)
        )).isInstanceOf(RateLimitExceededException.class);
        assertThatCode(() -> service.checkLoginAllowed(
                "user@example.com",
                proxiedRequest("127.0.0.1", "198.51.100.11", null)
        )).doesNotThrowAnyException();
    }

    @Test
    void untrustedRemoteAddressCannotSpoofForwardedHeaders() {
        AuthRateLimitService service = new AuthRateLimitService(properties(1, 900, 3, 3600, 0), new MutableClock());

        service.recordLoginFailure("user@example.com", proxiedRequest("198.51.100.20", "203.0.113.10", null));

        assertThatThrownBy(() -> service.checkLoginAllowed(
                "user@example.com",
                proxiedRequest("198.51.100.20", "203.0.113.11", null)
        )).isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void trustedProxyFallsBackToLastForwardedForAddress() {
        AuthRateLimitService service = new AuthRateLimitService(properties(1, 900, 3, 3600, 0), new MutableClock());

        service.recordLoginFailure("user@example.com", proxiedRequest("172.17.0.1", null, "spoofed, 198.51.100.10"));

        assertThatThrownBy(() -> service.checkLoginAllowed(
                "user@example.com",
                proxiedRequest("172.17.0.1", null, "spoofed, 198.51.100.10")
        )).isInstanceOf(RateLimitExceededException.class);
        assertThatCode(() -> service.checkLoginAllowed(
                "user@example.com",
                proxiedRequest("172.17.0.1", null, "spoofed, 198.51.100.11")
        )).doesNotThrowAnyException();
    }

    @Test
    void clearLoginFailuresAllowsRetry() {
        AuthRateLimitService service = new AuthRateLimitService(properties(1, 900, 3, 3600, 0), new MutableClock());
        HttpServletRequest request = request("203.0.113.10");

        service.recordLoginFailure("user@example.com", request);
        assertThatThrownBy(() -> service.checkLoginAllowed("user@example.com", request))
                .isInstanceOf(RateLimitExceededException.class);

        service.clearLoginFailures("user@example.com", request);

        assertThatCode(() -> service.checkLoginAllowed("user@example.com", request))
                .doesNotThrowAnyException();
    }

    @Test
    void passwordResetLimitUsesNormalizedEmailAndRemoteAddress() {
        AuthRateLimitService service = new AuthRateLimitService(properties(10, 900, 2, 3600, 0), new MutableClock());
        HttpServletRequest request = request("203.0.113.10");

        service.checkAndRecordPasswordReset("USER@example.com", request);
        service.checkAndRecordPasswordReset(" user@example.com ", request);

        assertThatThrownBy(() -> service.checkAndRecordPasswordReset("user@example.com", request))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void passwordResetCooldownBlocksImmediateRepeatsButExpires() {
        MutableClock clock = new MutableClock();
        AuthRateLimitService service = new AuthRateLimitService(properties(10, 900, 3, 3600, 300), clock);
        HttpServletRequest request = request("203.0.113.10");

        service.checkAndRecordPasswordReset("user@example.com", request);

        assertThatThrownBy(() -> service.checkAndRecordPasswordReset("user@example.com", request))
                .isInstanceOf(RateLimitExceededException.class);

        clock.advance(Duration.ofSeconds(301));

        assertThatCode(() -> service.checkAndRecordPasswordReset("user@example.com", request))
                .doesNotThrowAnyException();
    }

    @Test
    void recordsCleanExpiredUniqueKeysOpportunistically() throws Exception {
        MutableClock clock = new MutableClock();
        AuthRateLimitService service = new AuthRateLimitService(properties(10, 10, 10, 10, 0), clock);

        service.recordLoginFailure("one@example.com", request("203.0.113.10"));
        service.recordLoginFailure("two@example.com", request("203.0.113.11"));
        service.checkAndRecordPasswordReset("one@example.com", request("203.0.113.10"));
        service.checkAndRecordPasswordReset("two@example.com", request("203.0.113.11"));

        assertThat(counterSize(service, "loginFailures")).isEqualTo(2);
        assertThat(counterSize(service, "passwordResetAttempts")).isEqualTo(2);

        clock.advance(Duration.ofSeconds(11));

        service.recordLoginFailure("fresh@example.com", request("203.0.113.12"));
        service.checkAndRecordPasswordReset("fresh@example.com", request("203.0.113.12"));

        assertThat(counterSize(service, "loginFailures")).isEqualTo(1);
        assertThat(counterSize(service, "passwordResetAttempts")).isEqualTo(1);
    }

    private static HttpServletRequest request(String remoteAddr) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn(remoteAddr);
        return request;
    }

    private static HttpServletRequest proxiedRequest(String remoteAddr, String realIp, String forwardedFor) {
        HttpServletRequest request = request(remoteAddr);
        when(request.getHeader("X-Real-IP")).thenReturn(realIp);
        when(request.getHeader("X-Forwarded-For")).thenReturn(forwardedFor);
        return request;
    }

    private static int counterSize(AuthRateLimitService service, String fieldName) throws Exception {
        Field field = AuthRateLimitService.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        Object value = field.get(service);
        return ((Map<?, ?>) value).size();
    }

    private static AuthRateLimitProperties properties(
            int loginMaxAttempts,
            long loginWindowSeconds,
            int passwordResetMaxAttempts,
            long passwordResetWindowSeconds,
            long passwordResetCooldownSeconds
    ) {
        AuthRateLimitProperties properties = new AuthRateLimitProperties();
        properties.getLogin().setMaxAttempts(loginMaxAttempts);
        properties.getLogin().setWindowSeconds(loginWindowSeconds);
        properties.getPasswordReset().setMaxAttempts(passwordResetMaxAttempts);
        properties.getPasswordReset().setWindowSeconds(passwordResetWindowSeconds);
        properties.getPasswordReset().setCooldownSeconds(passwordResetCooldownSeconds);
        return properties;
    }

    private static final class MutableClock extends Clock {
        private Instant instant = Instant.parse("2026-06-08T12:00:00Z");

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }

        private void advance(Duration duration) {
            instant = instant.plus(duration);
        }
    }
}
