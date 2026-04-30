package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.AnonymousSubmissionRequestDTO;
import com.munichweekly.backend.dto.AnonymousSubmissionResponseDTO;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AnonymousSubmissionService {

    private static final int MAX_DESCRIPTION_LENGTH = 2000;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final CaptchaVerificationService captchaVerificationService;
    private final AnonymousUploadTokenService anonymousUploadTokenService;
    private final PasswordEncoder passwordEncoder;

    public AnonymousSubmissionService(
            IssueRepository issueRepository,
            UserRepository userRepository,
            SubmissionRepository submissionRepository,
            CaptchaVerificationService captchaVerificationService,
            AnonymousUploadTokenService anonymousUploadTokenService,
            PasswordEncoder passwordEncoder) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.captchaVerificationService = captchaVerificationService;
        this.anonymousUploadTokenService = anonymousUploadTokenService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AnonymousSubmissionResponseDTO createAnonymousSubmission(AnonymousSubmissionRequestDTO request) {
        validateRequest(request);

        if (!captchaVerificationService.verify(request.getCaptchaToken())) {
            throw new IllegalArgumentException("Captcha verification failed");
        }

        Issue issue = issueRepository.findById(request.getIssueId())
                .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
        validateSubmissionWindow(issue);

        User syntheticUser = createSyntheticUser();
        User savedUser = userRepository.save(syntheticUser);

        Submission submission = new Submission(savedUser, issue, null, request.getDescription().trim());
        submission.setStatus("pending");
        submission.setAnonymousContactEmail(normalizeOptionalEmail(request.getContactEmail()));
        Submission savedSubmission = submissionRepository.save(submission);

        String uploadToken = anonymousUploadTokenService.generateToken(savedSubmission.getId(), savedUser.getId());
        return new AnonymousSubmissionResponseDTO(
                savedSubmission.getId(),
                "/api/submissions/" + savedSubmission.getId() + "/anonymous-upload",
                uploadToken
        );
    }

    private void validateRequest(AnonymousSubmissionRequestDTO request) {
        if (request.getIssueId() == null) {
            throw new IllegalArgumentException("Issue is required");
        }

        if (request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Description is required");
        }

        if (request.getDescription().trim().length() > MAX_DESCRIPTION_LENGTH) {
            throw new IllegalArgumentException("Description must be 2000 characters or less");
        }

        String contactEmail = normalizeOptionalEmail(request.getContactEmail());
        if (contactEmail != null && !EMAIL_PATTERN.matcher(contactEmail).matches()) {
            throw new IllegalArgumentException("Contact email must be a valid email address");
        }
    }

    private void validateSubmissionWindow(Issue issue) {
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(issue.getSubmissionStart()) || now.isAfter(issue.getSubmissionEnd())) {
            throw new IllegalStateException("Not in valid date range");
        }
    }

    private User createSyntheticUser() {
        String syntheticId = UUID.randomUUID().toString();
        User user = new User();
        user.setEmail("anonymous-submission-" + syntheticId + "@anonymous.munichweekly.local");
        user.setNickname("Anonymous");
        user.setRole("user");
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setAccountType(User.ACCOUNT_TYPE_ANONYMOUS_SUBMISSION);
        return user;
    }

    private String normalizeOptionalEmail(String contactEmail) {
        if (contactEmail == null || contactEmail.trim().isEmpty()) {
            return null;
        }
        return contactEmail.trim();
    }
}
