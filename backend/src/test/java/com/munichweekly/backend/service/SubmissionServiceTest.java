package com.munichweekly.backend.service;

import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.UserRepository;
import com.munichweekly.backend.repository.VoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SubmissionServiceTest {

    private SubmissionRepository submissionRepository;
    private UserRepository userRepository;
    private VoteRepository voteRepository;
    private StorageService storageService;
    private SubmissionService service;

    @BeforeEach
    void setUp() {
        submissionRepository = mock(SubmissionRepository.class);
        IssueRepository issueRepository = mock(IssueRepository.class);
        userRepository = mock(UserRepository.class);
        voteRepository = mock(VoteRepository.class);
        storageService = mock(StorageService.class);

        service = new SubmissionService(
                submissionRepository,
                issueRepository,
                userRepository,
                voteRepository,
                storageService,
                mock(FileDownloadService.class),
                mock(ImageDimensionService.class)
        );
    }

    @Test
    void deletesAnonymousSubmissionAndUnusedSyntheticUserWhenNotSelected() {
        User anonymousUser = user(42L, User.ACCOUNT_TYPE_ANONYMOUS_SUBMISSION);
        Submission submission = submission(99L, anonymousUser, "https://cdn.example.com/anonymous.jpg");
        submission.setStatus("pending");
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));
        when(submissionRepository.findByUserId(42L)).thenReturn(List.of());
        when(storageService.deleteFile("https://cdn.example.com/anonymous.jpg")).thenReturn(true);

        service.deleteAnonymousSubmissionIfNotSelected(99L);

        verify(voteRepository).deleteBySubmission(submission);
        verify(submissionRepository).delete(submission);
        verify(storageService).deleteFile("https://cdn.example.com/anonymous.jpg");
        verify(voteRepository).deleteByUserId(42L);
        verify(userRepository).delete(anonymousUser);
    }

    @Test
    void refusesSelectedAnonymousSubmissionDeletion() {
        User anonymousUser = user(42L, User.ACCOUNT_TYPE_ANONYMOUS_SUBMISSION);
        Submission submission = submission(99L, anonymousUser, "https://cdn.example.com/selected.jpg");
        submission.setStatus("selected");
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));

        assertThatThrownBy(() -> service.deleteAnonymousSubmissionIfNotSelected(99L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Cannot delete selected anonymous submission");

        verify(voteRepository, never()).deleteBySubmission(submission);
        verify(submissionRepository, never()).delete(submission);
        verify(storageService, never()).deleteFile("https://cdn.example.com/selected.jpg");
    }

    @Test
    void refusesRegisteredSubmissionDeletionThroughAnonymousCleanup() {
        User registeredUser = user(42L, User.ACCOUNT_TYPE_REGISTERED);
        Submission submission = submission(99L, registeredUser, "https://cdn.example.com/registered.jpg");
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));

        assertThatThrownBy(() -> service.deleteAnonymousSubmissionIfNotSelected(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Only anonymous submissions can be deleted by this operation");

        verify(voteRepository, never()).deleteBySubmission(submission);
        verify(submissionRepository, never()).delete(submission);
        verify(storageService, never()).deleteFile("https://cdn.example.com/registered.jpg");
    }

    private User user(Long id, String accountType) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setAccountType(accountType);
        return user;
    }

    private Submission submission(Long id, User user, String imageUrl) {
        LocalDateTime now = LocalDateTime.now();
        Issue issue = new Issue(
                "Anonymous Cleanup",
                "Only anonymous submissions should be removable",
                now.minusDays(2),
                now.minusDays(1),
                now,
                now.plusDays(1)
        );
        issue.setId(7L);
        Submission submission = new Submission(user, issue, imageUrl, "A quiet street");
        submission.setId(id);
        return submission;
    }
}
