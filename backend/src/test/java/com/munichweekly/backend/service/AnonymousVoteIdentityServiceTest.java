package com.munichweekly.backend.service;

import com.munichweekly.backend.config.AnonymousVoteIdentityProperties;
import com.munichweekly.backend.exception.RateLimitExceededException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AnonymousVoteIdentityServiceTest {

    private static final String SECRET = "test-anonymous-vote-secret-32-bytes-minimum";
    private static final Instant NOW = Instant.parse("2026-06-08T12:00:00Z");

    @Test
    void signedCookieResolvesToOriginalSubjectWithoutIssuingNewCookie() {
        AnonymousVoteIdentityService service = service(properties(SECRET));
        String token = service.createTokenForTest("anon-subject-1", NOW);
        MockHttpServletResponse response = new MockHttpServletResponse();

        AnonymousVoteIdentityService.Resolution resolution = service.resolveOrIssue(
                token,
                "changed-legacy",
                request("203.0.113.10"),
                response
        );

        assertThat(resolution.subject()).isEqualTo("anon-subject-1");
        assertThat(resolution.source()).isEqualTo(AnonymousVoteIdentityService.IdentitySource.SIGNED_COOKIE);
        assertThat(response.getHeaders("Set-Cookie")).isEmpty();
    }

    @Test
    void tamperedSignedCookieIsRejectedAndDoesNotFallBackToLegacyVisitorId() {
        AnonymousVoteIdentityService service = service(properties(SECRET));
        String token = service.createTokenForTest("anon-subject-1", NOW);
        String[] tokenParts = token.split("\\.");
        String tamperedSubject = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("attacker-controlled-legacy".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        String tampered = tokenParts[0] + "." + tamperedSubject + "." + tokenParts[2] + "." + tokenParts[3];

        AnonymousVoteIdentityService.Resolution resolution = service.resolveOrIssue(
                tampered,
                "attacker-controlled-legacy",
                request("203.0.113.10"),
                new MockHttpServletResponse()
        );

        assertThat(resolution.subject()).isNotEqualTo("attacker-controlled-legacy");
        assertThat(resolution.source()).isEqualTo(AnonymousVoteIdentityService.IdentitySource.NEW_COOKIE);
    }

    @Test
    void legacyVisitorIdMigratesOnlyWhenSignedCookieIsMissing() {
        AnonymousVoteIdentityService service = service(properties(SECRET));
        MockHttpServletResponse response = new MockHttpServletResponse();

        AnonymousVoteIdentityService.Resolution resolution = service.resolveOrIssue(
                null,
                "legacy-visitor-1",
                request("203.0.113.10"),
                response
        );

        assertThat(resolution.subject()).isEqualTo("legacy-visitor-1");
        assertThat(resolution.source()).isEqualTo(AnonymousVoteIdentityService.IdentitySource.LEGACY_MIGRATION);
        assertThat(response.getHeaders("Set-Cookie"))
                .anySatisfy(header -> assertThat(header)
                        .contains(AnonymousVoteIdentityService.COOKIE_NAME + "=")
                        .contains("HttpOnly")
                        .contains("SameSite=Lax")
                        .contains("Path=/"));
    }

    @Test
    void legacyVisitorIdUsingReservedUserPrefixIsNotMigrated() {
        AnonymousVoteIdentityService service = service(properties(SECRET));
        MockHttpServletResponse response = new MockHttpServletResponse();

        AnonymousVoteIdentityService.Resolution resolution = service.resolveOrIssue(
                null,
                "user_7",
                request("203.0.113.10"),
                response
        );

        assertThat(resolution.subject()).startsWith("anon_");
        assertThat(resolution.source()).isEqualTo(AnonymousVoteIdentityService.IdentitySource.NEW_COOKIE);
    }

    @Test
    void anonymousSubjectCannotUseReservedUserPrefix() {
        AnonymousVoteIdentityService service = service(properties(SECRET));

        assertThatThrownBy(() -> service.createTokenForTest("user_7", NOW))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void statusResolutionWithoutAnyCookieDoesNotIssueNewCookie() {
        AnonymousVoteIdentityService service = service(properties(SECRET));
        MockHttpServletResponse response = new MockHttpServletResponse();

        Optional<AnonymousVoteIdentityService.Resolution> resolution = service.resolveExistingOrMigrate(
                null,
                null,
                request("203.0.113.10"),
                response
        );

        assertThat(resolution).isEmpty();
        assertThat(response.getHeaders("Set-Cookie")).isEmpty();
    }

    @Test
    void missingIdentityGetsRandomServerManagedSubject() {
        AnonymousVoteIdentityService service = service(properties(SECRET));
        MockHttpServletResponse response = new MockHttpServletResponse();

        AnonymousVoteIdentityService.Resolution resolution = service.resolveOrIssue(
                null,
                null,
                request("203.0.113.10"),
                response
        );

        assertThat(resolution.subject()).startsWith("anon_");
        assertThat(resolution.source()).isEqualTo(AnonymousVoteIdentityService.IdentitySource.NEW_COOKIE);
        assertThat(response.getHeaders("Set-Cookie")).hasSize(1);
    }

    @Test
    void tokenIssuanceIsRateLimitedByRemoteAddress() {
        AnonymousVoteIdentityProperties properties = properties(SECRET);
        properties.setTokenIssuanceMaxAttempts(1);
        properties.setTokenIssuanceWindowSeconds(60);
        AnonymousVoteIdentityService service = service(properties);

        service.resolveOrIssue(null, null, request("203.0.113.10"), new MockHttpServletResponse());

        assertThatThrownBy(() ->
                service.resolveOrIssue(null, null, request("203.0.113.10"), new MockHttpServletResponse())
        ).isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void repeatedAnonymousVoteAttemptsForSameSubmissionAreRateLimitedByRemoteAddress() {
        AnonymousVoteIdentityProperties properties = properties(SECRET);
        properties.setVoteAttemptMaxAttempts(1);
        properties.setVoteAttemptWindowSeconds(60);
        AnonymousVoteIdentityService service = service(properties);

        service.checkAndRecordAnonymousVoteAttempt(42L, request("203.0.113.10"));

        assertThatThrownBy(() ->
                service.checkAndRecordAnonymousVoteAttempt(42L, request("203.0.113.10"))
        ).isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void prodProfileRequiresConfiguredSecret() {
        AnonymousVoteIdentityProperties properties = properties("");

        assertThatThrownBy(() -> new AnonymousVoteIdentityService(
                properties,
                Clock.fixed(NOW, ZoneOffset.UTC),
                () -> new String[]{"prod"}
        )).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ANONYMOUS_VOTE_SECRET");
    }

    @Test
    void productionProfileForcesSecureCookie() {
        AnonymousVoteIdentityService service = new AnonymousVoteIdentityService(
                properties(SECRET),
                Clock.fixed(NOW, ZoneOffset.UTC),
                () -> new String[]{"prod"}
        );
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.resolveOrIssue(null, null, request("203.0.113.10"), response);

        assertThat(response.getHeaders("Set-Cookie"))
                .anySatisfy(header -> assertThat(header).contains("Secure"));
    }

    private static AnonymousVoteIdentityService service(AnonymousVoteIdentityProperties properties) {
        return new AnonymousVoteIdentityService(
                properties,
                Clock.fixed(NOW, ZoneOffset.UTC),
                () -> new String[0]
        );
    }

    private static AnonymousVoteIdentityProperties properties(String secret) {
        AnonymousVoteIdentityProperties properties = new AnonymousVoteIdentityProperties();
        properties.setSecret(secret);
        properties.setCookieSecure(false);
        properties.setTokenIssuanceMaxAttempts(50);
        properties.setTokenIssuanceWindowSeconds(600);
        properties.setVoteAttemptMaxAttempts(200);
        properties.setVoteAttemptWindowSeconds(600);
        return properties;
    }

    private static MockHttpServletRequest request(String remoteAddress) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(remoteAddress);
        return request;
    }
}
