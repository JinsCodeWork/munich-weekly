package com.munichweekly.backend.service;

import com.munichweekly.backend.dto.AvailableGalleryIssueDTO;
import com.munichweekly.backend.dto.GalleryIssueConfigRequestDTO;
import com.munichweekly.backend.dto.GallerySubmissionOrderResponseDTO;
import com.munichweekly.backend.model.GalleryIssueConfig;
import com.munichweekly.backend.model.GallerySubmissionOrder;
import com.munichweekly.backend.model.ImageDimensions;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.GalleryIssueConfigRepository;
import com.munichweekly.backend.repository.GallerySubmissionOrderRepository;
import com.munichweekly.backend.repository.IssueRepository;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

class GalleryIssueAdminServiceTest {

    private GalleryIssueConfigRepository galleryConfigRepository;
    private GallerySubmissionOrderRepository submissionOrderRepository;
    private IssueRepository issueRepository;
    private SubmissionRepository submissionRepository;
    private StorageService storageService;
    private GalleryIssueAdminService service;

    @BeforeEach
    void setUp() {
        galleryConfigRepository = mock(GalleryIssueConfigRepository.class);
        submissionOrderRepository = mock(GallerySubmissionOrderRepository.class);
        issueRepository = mock(IssueRepository.class);
        submissionRepository = mock(SubmissionRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        storageService = mock(StorageService.class);

        service = new GalleryIssueAdminService(
                galleryConfigRepository,
                submissionOrderRepository,
                issueRepository,
                submissionRepository,
                userRepository,
                storageService
        );
    }

    @Test
    void availableIssuesIncludeSelectedSubmissionCountForGalleryPublishing() {
        Issue issue = issue(7L);
        when(galleryConfigRepository.findIssuesWithoutGalleryConfig()).thenReturn(List.of(issue));
        when(submissionRepository.countByIssueAndStatus(issue, "selected")).thenReturn(1L);

        List<AvailableGalleryIssueDTO> availableIssues = service.getIssuesWithoutGalleryConfig();

        assertThat(availableIssues).singleElement().satisfies(availableIssue -> {
            assertThat(availableIssue.getId()).isEqualTo(7L);
            assertThat(availableIssue.getTitle()).isEqualTo("Anonymous Week");
            assertThat(availableIssue.getSelectedSubmissionCount()).isEqualTo(1L);
        });
    }

    @Test
    void customGalleryImageUploadStoresDimensionsAndMetadata() throws IOException {
        Issue issue = issue(7L);
        GalleryIssueConfig config = galleryConfig(issue, 3L);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "admin.jpg",
                "image/jpeg",
                "fake-image".getBytes()
        );

        when(issueRepository.findById(7L)).thenReturn(Optional.of(issue));
        when(galleryConfigRepository.findByIssueId(7L)).thenReturn(Optional.of(config));
        when(submissionOrderRepository.findMaxDisplayOrderByGalleryConfigId(3L)).thenReturn(2);
        when(storageService.storeFileWithDimensions(any(), any(), any(), any()))
                .thenReturn(new StorageService.StorageResult(
                        "https://cdn.example.com/custom.jpg",
                        new ImageDimensions(1200, 800)
                ));
        when(submissionOrderRepository.save(any(GallerySubmissionOrder.class))).thenAnswer(invocation -> {
            GallerySubmissionOrder order = invocation.getArgument(0);
            order.setId(42L);
            return order;
        });

        GallerySubmissionOrderResponseDTO response = service.uploadCustomGalleryImageByIssueId(
                7L,
                file,
                "Campus wall",
                "Not a submitted work"
        );

        assertThat(response.getItemType()).isEqualTo("CUSTOM_IMAGE");
        assertThat(response.getDisplayOrder()).isEqualTo(3);
        assertThat(response.getCustomImage().getImageUrl()).isEqualTo("https://cdn.example.com/custom.jpg");
        assertThat(response.getCustomImage().getTitle()).isEqualTo("Campus wall");
        assertThat(response.getCustomImage().getDescription()).isEqualTo("Not a submitted work");
        assertThat(response.getCustomImage().getImageWidth()).isEqualTo(1200);
        assertThat(response.getCustomImage().getImageHeight()).isEqualTo(800);
        assertThat(response.getSubmission()).isNull();
    }

    @Test
    void removingCustomGalleryImageDeletesStoredFile() {
        Issue issue = issue(7L);
        GalleryIssueConfig config = galleryConfig(issue, 3L);
        GallerySubmissionOrder customOrder = new GallerySubmissionOrder(
                config,
                "https://cdn.example.com/custom.jpg",
                "Campus wall",
                null,
                1200,
                800,
                1
        );
        customOrder.setId(42L);

        when(galleryConfigRepository.findByIssueId(7L)).thenReturn(Optional.of(config));
        when(submissionOrderRepository.findByGalleryConfigIdOrderByDisplayOrderAsc(3L))
                .thenReturn(List.of(customOrder));

        service.updateSubmissionOrderByIssueId(7L, List.<GalleryIssueConfigRequestDTO.SubmissionOrderRequestDTO>of());

        verify(storageService).deleteFile("https://cdn.example.com/custom.jpg");
        verify(submissionOrderRepository).deleteAll(List.of(customOrder));
        verify(submissionOrderRepository).flush();
        verify(submissionOrderRepository, never()).saveAll(any());
    }

    private Issue issue(Long id) {
        LocalDateTime now = LocalDateTime.now();
        Issue issue = new Issue(
                "Anonymous Week",
                "Selected anonymous submissions should be publishable",
                now.minusDays(7),
                now.minusDays(1),
                now,
                now.plusDays(7)
        );
        issue.setId(id);
        return issue;
    }

    private GalleryIssueConfig galleryConfig(Issue issue, Long id) {
        GalleryIssueConfig config = new GalleryIssueConfig(issue, mock(User.class));
        config.setId(id);
        return config;
    }
}
