package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.AnonymousSubmissionRequestDTO;
import com.munichweekly.backend.dto.AnonymousSubmissionResponseDTO;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AnonymousSubmissionServiceTest {

    private IssueRepository issueRepository;
    private UserRepository userRepository;
    private SubmissionRepository submissionRepository;
    private CaptchaVerificationService captchaVerificationService;
    private AnonymousUploadTokenService anonymousUploadTokenService;
    private PasswordEncoder passwordEncoder;
    private AnonymousSubmissionService service;

    @BeforeEach
    void setUp() {
        issueRepository = mock(IssueRepository.class);
        userRepository = mock(UserRepository.class);
        submissionRepository = mock(SubmissionRepository.class);
        captchaVerificationService = mock(CaptchaVerificationService.class);
        anonymousUploadTokenService = mock(AnonymousUploadTokenService.class);
        passwordEncoder = mock(PasswordEncoder.class);

        service = new AnonymousSubmissionService(
                issueRepository,
                userRepository,
                submissionRepository,
                captchaVerificationService,
                anonymousUploadTokenService,
                passwordEncoder
        );
    }

    @Test
    void createsSyntheticAnonymousUserAndPendingSubmissionWhenCaptchaPasses() {
        Issue issue = activeIssue();
        when(issueRepository.findById(7L)).thenReturn(Optional.of(issue));
        when(captchaVerificationService.verify("captcha-token")).thenReturn(true);
        when(passwordEncoder.encode(any())).thenReturn("encoded-unusable-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", 42L);
            return user;
        });
        when(submissionRepository.save(any(Submission.class))).thenAnswer(invocation -> {
            Submission submission = invocation.getArgument(0);
            ReflectionTestUtils.setField(submission, "id", 99L);
            return submission;
        });
        when(anonymousUploadTokenService.generateToken(99L, 42L)).thenReturn("upload-token");

        AnonymousSubmissionRequestDTO request = new AnonymousSubmissionRequestDTO();
        request.setIssueId(7L);
        request.setDescription("A quiet street after rain");
        request.setContactEmail("visitor@example.com");
        request.setCaptchaToken("captcha-token");

        AnonymousSubmissionResponseDTO response = service.createAnonymousSubmission(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User syntheticUser = userCaptor.getValue();
        assertThat(syntheticUser.getEmail()).startsWith("anonymous-submission-");
        assertThat(syntheticUser.getEmail()).endsWith("@anonymous.munichweekly.local");
        assertThat(syntheticUser.getNickname()).isEqualTo("Anonymous");
        assertThat(syntheticUser.getRole()).isEqualTo("user");
        assertThat(syntheticUser.getAccountType()).isEqualTo("ANONYMOUS_SUBMISSION");
        assertThat(syntheticUser.getPassword()).isEqualTo("encoded-unusable-password");

        ArgumentCaptor<Submission> submissionCaptor = ArgumentCaptor.forClass(Submission.class);
        verify(submissionRepository).save(submissionCaptor.capture());
        Submission submission = submissionCaptor.getValue();
        assertThat(submission.getUser()).isSameAs(syntheticUser);
        assertThat(submission.getIssue()).isSameAs(issue);
        assertThat(submission.getStatus()).isEqualTo("pending");
        assertThat(submission.getDescription()).isEqualTo("A quiet street after rain");
        assertThat(submission.getAnonymousContactEmail()).isEqualTo("visitor@example.com");

        assertThat(response.getSubmissionId()).isEqualTo(99L);
        assertThat(response.getUploadUrl()).isEqualTo("/api/submissions/99/anonymous-upload");
        assertThat(response.getUploadToken()).isEqualTo("upload-token");
    }

    @Test
    void rejectsInvalidCaptchaBeforeCreatingDatabaseRows() {
        AnonymousSubmissionRequestDTO request = new AnonymousSubmissionRequestDTO();
        request.setIssueId(7L);
        request.setDescription("A quiet street after rain");
        request.setCaptchaToken("bad-token");
        when(captchaVerificationService.verify("bad-token")).thenReturn(false);

        assertThatThrownBy(() -> service.createAnonymousSubmission(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Captcha verification failed");

        verify(userRepository, never()).save(any());
        verify(submissionRepository, never()).save(any());
    }

    @Test
    void rejectsInvalidContactEmail() {
        AnonymousSubmissionRequestDTO request = new AnonymousSubmissionRequestDTO();
        request.setIssueId(7L);
        request.setDescription("A quiet street after rain");
        request.setContactEmail("not-an-email");
        request.setCaptchaToken("captcha-token");
        when(captchaVerificationService.verify("captcha-token")).thenReturn(true);

        assertThatThrownBy(() -> service.createAnonymousSubmission(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Contact email must be a valid email address");

        verify(userRepository, never()).save(any());
        verify(submissionRepository, never()).save(any());
    }

    private Issue activeIssue() {
        LocalDateTime now = LocalDateTime.now();
        return new Issue(
                "Street Corners",
                "Photograph a corner of Munich",
                now.minusDays(1),
                now.plusDays(1),
                now.plusDays(2),
                now.plusDays(3)
        );
    }
}
