package com.munichweekly.backend.service;

import com.mailjet.client.ClientOptions;
import com.mailjet.client.MailjetClient;
import com.mailjet.client.MailjetRequest;
import com.mailjet.client.MailjetResponse;
import com.mailjet.client.resource.Emailv31;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.logging.Logger;

/**
 * Email service implementation using Mailjet
 */
@Service
public class MailjetEmailService implements EmailService {
    
    private static final Logger logger = Logger.getLogger(MailjetEmailService.class.getName());
    
    @Value("${mailjet.api.key}")
    private String apiKey;
    
    @Value("${mailjet.api.secret}")
    private String apiSecret;
    
    @Value("${app.frontend.url}")
    private String frontendUrl;
    
    @Override
    public void sendPasswordResetEmail(String to, String token) {
        try {
            MailjetClient client = new MailjetClient(ClientOptions.builder()
                    .apiKey(apiKey)
                    .apiSecretKey(apiSecret)
                    .build());
            
            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put("From", new JSONObject()
                                            .put("Email", "noreply@munichweekly.art")
                                            .put("Name", "Munich Weekly"))
                                    .put("To", new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", to)))
                                    .put("Subject", "Reset your password - Munich Weekly")
                                    .put("TextPart", "Reset your password by clicking the following link: " + 
                                            frontendUrl + "/reset-password?token=" + token)
                                    .put("HTMLPart", createResetPasswordHtml(token))
                                    .put("CustomID", "PasswordReset")));
            
            MailjetResponse response = client.post(request);
            logger.info("Password reset email sent to " + to + ", status: " + response.getStatus());
            
        } catch (Exception e) {
            logger.severe("Failed to send password reset email: " + e.getMessage());
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }
    
    private String createResetPasswordHtml(String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>" +
                "<h1 style='color: #333; text-align: center;'>Munich Weekly</h1>" +
                "<div style='background-color: #f8f8f8; padding: 20px; border-radius: 5px;'>" +
                "<h2 style='color: #333;'>Password Reset Request</h2>" +
                "<p style='color: #666; line-height: 1.5;'>You have requested to reset your password. Please click the button below to set a new password:</p>" +
                "<div style='text-align: center; margin: 30px 0;'>" +
                "<a href='" + resetLink + "' style='background-color: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;'>Reset Password</a>" +
                "</div>" +
                "<p style='color: #666; line-height: 1.5;'>If you did not request a password reset, please ignore this email or contact support.</p>" +
                "<p style='color: #666; line-height: 1.5;'>This link will expire in 30 minutes.</p>" +
                "</div>" +
                "<p style='color: #999; font-size: 12px; text-align: center; margin-top: 20px;'>&copy; " + java.time.Year.now().getValue() + " Munich Weekly. All rights reserved.</p>" +
                "</div>";
    }
} 