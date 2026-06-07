package com.munichweekly.backend.service;

import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.GalleryIssueConfigRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class IssueServiceTest {

    private IssueRepository issueRepository;
    private SubmissionRepository submissionRepository;
    private UserRepository userRepository;
    private VoteRepository voteRepository;
    private GalleryIssueConfigRepository galleryIssueConfigRepository;
    private StorageService storageService;
    private IssueService service;

    @BeforeEach
    void setUp() {
        issueRepository = mock(IssueRepository.class);
        submissionRepository = mock(SubmissionRepository.class);
        userRepository = mock(UserRepository.class);
        voteRepository = mock(VoteRepository.class);
        galleryIssueConfigRepository = mock(GalleryIssueConfigRepository.class);
        storageService = mock(StorageService.class);
        SubmissionService submissionService = new SubmissionService(
                submissionRepository,
                issueRepository,
                userRepository,
                voteRepository,
                storageService,
                mock(FileDownloadService.class),
                mock(ImageDimensionService.class)
        );

        service = new IssueService(
                issueRepository,
                submissionRepository,
                voteRepository,
                galleryIssueConfigRepository,
                submissionService
        );
    }

    @Test
    void deletesIssueWhenNoDependenciesExist() {
        Issue issue = issue(7L);
        when(issueRepository.findById(7L)).thenReturn(Optional.of(issue));
        when(galleryIssueConfigRepository.existsByIssueId(7L)).thenReturn(false);
        when(submissionRepository.findByIssue(issue)).thenReturn(List.of());
        when(voteRepository.countByIssueId(7L)).thenReturn(0L);

        service.deleteIssue(7L);

        verify(issueRepository).delete(issue);
    }

    @Test
    void refusesDeletionWhenRegisteredSubmissionsExist() {
        Issue issue = issue(7L);
        User registeredUser = user(42L, User.ACCOUNT_TYPE_REGISTERED);
        Submission submission = submission(99L, issue, registeredUser, "https://cdn.example.com/registered.jpg");
        when(issueRepository.findById(7L)).thenReturn(Optional.of(issue));
        when(galleryIssueConfigRepository.existsByIssueId(7L)).thenReturn(false);
        when(submissionRepository.findByIssue(issue)).thenReturn(List.of(submission));

        assertThatThrownBy(() -> service.deleteIssue(7L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Cannot delete issue 7 because it has non-anonymous submissions");

        verify(issueRepository, never()).delete(issue);
        verify(submissionRepository, never()).delete(submission);
        verify(storageService, never()).deleteFile(any());
    }

    @Test
    void deletesIssueAndAnonymousSubmissionsWhenOnlyUnselectedAnonymousSubmissionsExist() {
        Issue issue = issue(7L);
        User anonymousUser = user(42L, User.ACCOUNT_TYPE_ANONYMOUS_SUBMISSION);
        Submission submission = submission(99L, issue, anonymousUser, "https://cdn.example.com/anonymous.jpg");
        submission.setStatus("pending");
        when(issueRepository.findById(7L)).thenReturn(Optional.of(issue));
        when(galleryIssueConfigRepository.existsByIssueId(7L)).thenReturn(false);
        when(submissionRepository.findByIssue(issue)).thenReturn(List.of(submission));
        when(submissionRepository.findByUserId(42L)).thenReturn(List.of());
        when(storageService.deleteFile("https://cdn.example.com/anonymous.jpg")).thenReturn(true);

        service.deleteIssue(7L);

        verify(voteRepository).deleteBySubmission(submission);
        verify(submissionRepository).delete(submission);
        verify(storageService).deleteFile("https://cdn.example.com/anonymous.jpg");
        verify(voteRepository).deleteByUserId(42L);
        verify(userRepository).delete(anonymousUser);
        verify(issueRepository).delete(issue);
    }

    @Test
    void refusesDeletionWhenSelectedAnonymousSubmissionExists() {
        Issue issue = issue(7L);
        User anonymousUser = user(42L, User.ACCOUNT_TYPE_ANONYMOUS_SUBMISSION);
        Submission submission = submission(99L, issue, anonymousUser, "https://cdn.example.com/selected.jpg");
        submission.setStatus("selected");
        when(issueRepository.findById(7L)).thenReturn(Optional.of(issue));
        when(galleryIssueConfigRepository.existsByIssueId(7L)).thenReturn(false);
        when(submissionRepository.findByIssue(issue)).thenReturn(List.of(submission));

        assertThatThrownBy(() -> service.deleteIssue(7L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Cannot delete issue 7 because it has selected anonymous submissions");

        verify(voteRepository, never()).deleteBySubmission(submission);
        verify(submissionRepository, never()).delete(submission);
        verify(storageService, never()).deleteFile(any());
        verify(issueRepository, never()).delete(issue);
    }

    @Test
    void refusesDeletionWhenIssueDoesNotExist() {
        when(issueRepository.findById(7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteIssue(7L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Issue not found with id: 7");

        verify(issueRepository, never()).delete(any(Issue.class));
    }

    @Test
    void refusesDeletionWhenVotesExistWithoutSubmissions() {
        Issue issue = issue(7L);
        when(issueRepository.findById(7L)).thenReturn(Optional.of(issue));
        when(galleryIssueConfigRepository.existsByIssueId(7L)).thenReturn(false);
        when(submissionRepository.findByIssue(issue)).thenReturn(List.of());
        when(voteRepository.countByIssueId(7L)).thenReturn(3L);

        assertThatThrownBy(() -> service.deleteIssue(7L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Cannot delete issue 7 because it has votes");

        verify(issueRepository, never()).delete(issue);
    }

    @Test
    void refusesDeletionWhenGalleryConfigExists() {
        Issue issue = issue(7L);
        when(issueRepository.findById(7L)).thenReturn(Optional.of(issue));
        when(galleryIssueConfigRepository.existsByIssueId(7L)).thenReturn(true);

        assertThatThrownBy(() -> service.deleteIssue(7L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Cannot delete issue 7 because it has a gallery configuration");

        verify(issueRepository, never()).delete(issue);
    }

    private Issue issue(Long id) {
        LocalDateTime now = LocalDateTime.now();
        Issue issue = new Issue(
                "Delete Me",
                "An issue with no dependencies",
                now.minusDays(7),
                now.minusDays(1),
                now,
                now.plusDays(7)
        );
        issue.setId(id);
        return issue;
    }

    private User user(Long id, String accountType) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setAccountType(accountType);
        return user;
    }

    private Submission submission(Long id, Issue issue, User user, String imageUrl) {
        Submission submission = new Submission(user, issue, imageUrl, "A quiet street");
        submission.setId(id);
        return submission;
    }
}
