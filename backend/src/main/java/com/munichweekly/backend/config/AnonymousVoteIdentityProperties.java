package com.munichweekly.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "anonymous.vote")
public class AnonymousVoteIdentityProperties {

    private String secret = "";
    private boolean cookieSecure = false;
    private long cookieMaxAgeSeconds = 31_536_000;
    private int tokenIssuanceMaxAttempts = 50;
    private long tokenIssuanceWindowSeconds = 600;
    private int voteAttemptMaxAttempts = 200;
    private long voteAttemptWindowSeconds = 600;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public boolean isCookieSecure() {
        return cookieSecure;
    }

    public void setCookieSecure(boolean cookieSecure) {
        this.cookieSecure = cookieSecure;
    }

    public long getCookieMaxAgeSeconds() {
        return cookieMaxAgeSeconds;
    }

    public void setCookieMaxAgeSeconds(long cookieMaxAgeSeconds) {
        this.cookieMaxAgeSeconds = cookieMaxAgeSeconds;
    }

    public int getTokenIssuanceMaxAttempts() {
        return tokenIssuanceMaxAttempts;
    }

    public void setTokenIssuanceMaxAttempts(int tokenIssuanceMaxAttempts) {
        this.tokenIssuanceMaxAttempts = tokenIssuanceMaxAttempts;
    }

    public long getTokenIssuanceWindowSeconds() {
        return tokenIssuanceWindowSeconds;
    }

    public void setTokenIssuanceWindowSeconds(long tokenIssuanceWindowSeconds) {
        this.tokenIssuanceWindowSeconds = tokenIssuanceWindowSeconds;
    }

    public int getVoteAttemptMaxAttempts() {
        return voteAttemptMaxAttempts;
    }

    public void setVoteAttemptMaxAttempts(int voteAttemptMaxAttempts) {
        this.voteAttemptMaxAttempts = voteAttemptMaxAttempts;
    }

    public long getVoteAttemptWindowSeconds() {
        return voteAttemptWindowSeconds;
    }

    public void setVoteAttemptWindowSeconds(long voteAttemptWindowSeconds) {
        this.voteAttemptWindowSeconds = voteAttemptWindowSeconds;
    }
}
