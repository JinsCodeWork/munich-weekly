package com.munichweekly.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HexFormat;

/**
 * Utility class for generating and verifying JWT tokens.
 */
@Component
public class JwtUtil {

    private static final String OLD_FALLBACK_SECRET_SHA256 = "24352536ca58b09336793d644f7acf5294bbf189f5a6bf56fa2949c4f361aea9";
    private static final int MIN_SECRET_BYTES = 32;

    // Secret key for signing tokens (should be stored securely in env variables)
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expirationMs}")
    private long expirationMs;
    private Key key;

    /**
     * Generate JWT token for a given user ID.
     */
    public String generateToken(Long userId) {
        return Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Validate and parse token.
     */
    public Claims parseToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException e) {
            throw new JwtException("Invalid JWT token", e);
        }
    }

    /**
     * Extract user ID from token.
     */
    public Long extractUserId(String token) {
        try {
            return Long.parseLong(parseToken(token).getSubject());
        } catch (NumberFormatException e) {
            throw new JwtException("Invalid JWT subject", e);
        }
    }

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(validateSigningSecret(secret));
    }

    public static byte[] validateSigningSecret(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET must be configured");
        }

        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (OLD_FALLBACK_SECRET_SHA256.equals(sha256Hex(secretBytes))) {
            throw new IllegalStateException("JWT_SECRET must not use the old fallback value");
        }

        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes");
        }

        return secretBytes;
    }

    private static String sha256Hex(byte[] value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 digest is not available", e);
        }
    }
}
