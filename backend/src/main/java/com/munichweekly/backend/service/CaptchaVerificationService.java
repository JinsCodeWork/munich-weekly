package com.munichweekly.backend.service;

public interface CaptchaVerificationService {
    boolean verify(String captchaToken);
}
