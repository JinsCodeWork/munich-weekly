package com.munichweekly.backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Duration;
import java.util.Date;

@Service
public class AnonymousUploadTokenService {

    private static final String TOKEN_SUBJECT = "anonymous-submission-upload";
    private static final String SUBMISSION_ID_CLAIM = "submissionId";
    private static final String USER_ID_CLAIM = "userId";

    private final Key key;
    private final long expirationMs;

    public AnonymousUploadTokenService(
            @Value("${jwt.secret}") String secret,
            @Value("${anonymous.upload-token.expiration-ms:900000}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expirationMs = expirationMs;
    }

    public String generateToken(Long submissionId, Long userId) {
        Date now = new Date();
        return Jwts.builder()
                .setSubject(TOKEN_SUBJECT)
                .claim(SUBMISSION_ID_CLAIM, submissionId)
                .claim(USER_ID_CLAIM, userId)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public AnonymousUploadTokenClaims validateToken(String token, Long expectedSubmissionId) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        if (!TOKEN_SUBJECT.equals(claims.getSubject())) {
            throw new IllegalArgumentException("Invalid anonymous upload token");
        }

        Long submissionId = claims.get(SUBMISSION_ID_CLAIM, Number.class).longValue();
        Long userId = claims.get(USER_ID_CLAIM, Number.class).longValue();

        if (!submissionId.equals(expectedSubmissionId)) {
            throw new IllegalArgumentException("Anonymous upload token does not match submission");
        }

        return new AnonymousUploadTokenClaims(submissionId, userId);
    }

    public Duration getExpiration() {
        return Duration.ofMillis(expirationMs);
    }

    public record AnonymousUploadTokenClaims(Long submissionId, Long userId) {
    }
}
