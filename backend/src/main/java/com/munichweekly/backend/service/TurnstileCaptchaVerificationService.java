package com.munichweekly.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;

@Service
public class TurnstileCaptchaVerificationService implements CaptchaVerificationService {

    private final RestTemplate restTemplate;
    private final String secretKey;
    private final String verifyUrl;

    public TurnstileCaptchaVerificationService(
            @Value("${captcha.turnstile.secret-key:}") String secretKey,
            @Value("${captcha.turnstile.verify-url:https://challenges.cloudflare.com/turnstile/v0/siteverify}") String verifyUrl) {
        this.restTemplate = new RestTemplateBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .readTimeout(Duration.ofSeconds(5))
                .build();
        this.secretKey = secretKey;
        this.verifyUrl = verifyUrl;
    }

    @Override
    public boolean verify(String captchaToken) {
        if (isBlank(secretKey) || isBlank(captchaToken)) {
            return false;
        }

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("secret", secretKey);
        body.add("response", captchaToken);

        try {
            TurnstileVerifyResponse response = restTemplate.postForObject(
                    verifyUrl,
                    body,
                    TurnstileVerifyResponse.class
            );
            return response != null && response.success();
        } catch (RestClientException e) {
            return false;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private record TurnstileVerifyResponse(boolean success, List<String> errorCodes) {
    }
}
