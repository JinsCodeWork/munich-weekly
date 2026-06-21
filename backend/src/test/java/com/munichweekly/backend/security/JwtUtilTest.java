package com.munichweekly.backend.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Key;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private static final String OLD_FALLBACK_SECRET = "this-is-a-very-secret-key-" + "123456789077883932032328";
    private static final String VALID_TEST_SECRET = "test-jwt-secret-32-bytes-minimum!!";

    @Test
    void validSecretCanGenerateAndParseToken() {
        JwtUtil jwtUtil = jwtUtilWithSecret(VALID_TEST_SECRET);

        String token = jwtUtil.generateToken(42L);

        assertThat(jwtUtil.extractUserId(token)).isEqualTo(42L);
    }

    @Test
    void invalidTokenRaisesJwtException() {
        JwtUtil jwtUtil = jwtUtilWithSecret(VALID_TEST_SECRET);

        assertThatThrownBy(() -> jwtUtil.extractUserId("not-a-jwt"))
                .isInstanceOf(JwtException.class)
                .hasMessageContaining("Invalid JWT token");
    }

    @Test
    void nonNumericSubjectRaisesJwtException() {
        JwtUtil jwtUtil = jwtUtilWithSecret(VALID_TEST_SECRET);
        Key key = (Key) ReflectionTestUtils.getField(jwtUtil, "key");
        String token = Jwts.builder()
                .setSubject("not-a-user-id")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000L))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        assertThatThrownBy(() -> jwtUtil.extractUserId(token))
                .isInstanceOf(JwtException.class)
                .hasMessageContaining("Invalid JWT subject");
    }

    @Test
    void blankSecretFailsInitialization() {
        assertThatThrownBy(() -> jwtUtilWithSecret("   "))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void oldFallbackSecretFailsInitialization() {
        assertThatThrownBy(() -> jwtUtilWithSecret(OLD_FALLBACK_SECRET))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("old fallback");
    }

    @Test
    void shortSecretFailsInitialization() {
        assertThatThrownBy(() -> jwtUtilWithSecret("1234567890123456789012345678901"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 bytes");
    }

    private JwtUtil jwtUtilWithSecret(String secret) {
        JwtUtil jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", secret);
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 3600000L);
        jwtUtil.init();
        return jwtUtil;
    }
}
