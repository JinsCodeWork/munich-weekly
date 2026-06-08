package com.munichweekly.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "auth.rate-limit")
public class AuthRateLimitProperties {

    private Limit login = new Limit(10, 900);
    private PasswordResetLimit passwordReset = new PasswordResetLimit(3, 3600, 300);

    public Limit getLogin() {
        return login;
    }

    public void setLogin(Limit login) {
        this.login = login;
    }

    public PasswordResetLimit getPasswordReset() {
        return passwordReset;
    }

    public void setPasswordReset(PasswordResetLimit passwordReset) {
        this.passwordReset = passwordReset;
    }

    public static class Limit {
        private int maxAttempts;
        private long windowSeconds;

        public Limit() {
        }

        public Limit(int maxAttempts, long windowSeconds) {
            this.maxAttempts = maxAttempts;
            this.windowSeconds = windowSeconds;
        }

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public long getWindowSeconds() {
            return windowSeconds;
        }

        public void setWindowSeconds(long windowSeconds) {
            this.windowSeconds = windowSeconds;
        }
    }

    public static class PasswordResetLimit extends Limit {
        private long cooldownSeconds;

        public PasswordResetLimit() {
        }

        public PasswordResetLimit(int maxAttempts, long windowSeconds, long cooldownSeconds) {
            super(maxAttempts, windowSeconds);
            this.cooldownSeconds = cooldownSeconds;
        }

        public long getCooldownSeconds() {
            return cooldownSeconds;
        }

        public void setCooldownSeconds(long cooldownSeconds) {
            this.cooldownSeconds = cooldownSeconds;
        }
    }
}
