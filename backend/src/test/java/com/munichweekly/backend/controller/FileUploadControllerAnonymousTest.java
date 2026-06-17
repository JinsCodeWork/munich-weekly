package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.FileUploadResponseDTO;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.service.AnonymousUploadTokenService;
import com.munichweekly.backend.service.LocalStorageService;
import com.munichweekly.backend.service.R2StorageService;
import com.munichweekly.backend.service.StorageService;
import com.munichweekly.backend.service.SubmissionUploadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FileUploadControllerAnonymousTest {

    private StorageService storageService;
    private R2StorageService r2StorageService;
    private SubmissionRepository submissionRepository;
    private AnonymousUploadTokenService anonymousUploadTokenService;
    private FileUploadController controller;

    @BeforeEach
    void setUp() {
        storageService = mock(StorageService.class);
        r2StorageService = mock(R2StorageService.class);
        submissionRepository = mock(SubmissionRepository.class);
        anonymousUploadTokenService = mock(AnonymousUploadTokenService.class);
        controller = new FileUploadController(
                storageService,
                new SubmissionUploadService(submissionRepository),
                r2StorageService,
                mock(LocalStorageService.class),
                anonymousUploadTokenService
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void uploadsAnonymousSubmissionWhenTokenMatchesOwner() throws Exception {
        Submission submission = anonymousSubmission();
        when(anonymousUploadTokenService.validateToken("token", 99L))
                .thenReturn(new AnonymousUploadTokenService.AnonymousUploadTokenClaims(99L, 42L));
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));
        when(storageService.storeFileWithDimensions(any(), any(), any(), any()))
                .thenReturn(new StorageService.StorageResult("/uploads/anon.jpg", null));

        ResponseEntity<FileUploadResponseDTO> response = controller.uploadImageToAnonymousSubmission(
                "99",
                "token",
                new MockMultipartFile("file", "photo.jpg", "image/jpeg", "image".getBytes())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getImageUrl()).isEqualTo("/uploads/anon.jpg");
        assertThat(submission.getImageUrl()).isEqualTo("/uploads/anon.jpg");
        verify(submissionRepository).save(submission);
    }

    @Test
    void rejectsAnonymousUploadWhenSubmissionAlreadyHasImage() throws Exception {
        Submission submission = anonymousSubmission();
        submission.setImageUrl("/uploads/existing.jpg");
        when(anonymousUploadTokenService.validateToken("token", 99L))
                .thenReturn(new AnonymousUploadTokenService.AnonymousUploadTokenClaims(99L, 42L));
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));

        ResponseEntity<FileUploadResponseDTO> response = controller.uploadImageToAnonymousSubmission(
                "99",
                "token",
                new MockMultipartFile("file", "photo.jpg", "image/jpeg", "image".getBytes())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("Anonymous submission already has an uploaded image");
        verify(storageService, never()).storeFileWithDimensions(any(), any(), any(), any());
    }

    @Test
    void rejectsAnonymousUploadWhenTokenOwnerDoesNotMatchSubmissionOwner() throws Exception {
        Submission submission = anonymousSubmission();
        when(anonymousUploadTokenService.validateToken("token", 99L))
                .thenReturn(new AnonymousUploadTokenService.AnonymousUploadTokenClaims(99L, 100L));
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));

        ResponseEntity<FileUploadResponseDTO> response = controller.uploadImageToAnonymousSubmission(
                "99",
                "token",
                new MockMultipartFile("file", "photo.jpg", "image/jpeg", "image".getBytes())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(storageService, never()).storeFileWithDimensions(any(), any(), any(), any());
    }

    @Test
    void ownerCanCheckOwnSubmissionImage() {
        Submission submission = submissionWithImage();
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));
        when(r2StorageService.fileExists("/uploads/owner.jpg")).thenReturn(false);
        authenticateUser(42L, "user");

        ResponseEntity<Map<String, Object>> response = controller.checkImage("99");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("imageUrl", "/uploads/owner.jpg");
        verify(r2StorageService).fileExists("/uploads/owner.jpg");
    }

    @Test
    void adminCanCheckAnySubmissionImage() {
        Submission submission = submissionWithImage();
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));
        when(r2StorageService.fileExists("/uploads/owner.jpg")).thenReturn(false);
        authenticateUser(100L, "admin");

        ResponseEntity<Map<String, Object>> response = controller.checkImage("99");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("imageUrl", "/uploads/owner.jpg");
        verify(r2StorageService).fileExists("/uploads/owner.jpg");
    }

    @Test
    void rejectsNonOwnerCheckImageBeforeInspectingStorage() {
        Submission submission = submissionWithImage();
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));
        authenticateUser(100L, "user");

        ResponseEntity<Map<String, Object>> response = controller.checkImage("99");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).doesNotContainKey("imageUrl");
        verify(r2StorageService, never()).fileExists(anyString());
        verify(r2StorageService, never()).extractObjectKeyFromUrl(anyString());
        verify(r2StorageService, never()).getS3Client();
    }

    @Test
    void ownerCanReadOwnSubmissionImageDirectly() {
        Submission submission = submissionWithImage();
        byte[] imageBytes = "image".getBytes();
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));
        when(r2StorageService.getObjectBytes("/uploads/owner.jpg")).thenReturn(imageBytes);
        authenticateUser(42L, "user");

        ResponseEntity<byte[]> response = controller.getImageDirectly("99");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(imageBytes);
        verify(r2StorageService).getObjectBytes("/uploads/owner.jpg");
    }

    @Test
    void adminCanReadAnySubmissionImageDirectly() {
        Submission submission = submissionWithImage();
        byte[] imageBytes = "image".getBytes();
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));
        when(r2StorageService.getObjectBytes("/uploads/owner.jpg")).thenReturn(imageBytes);
        authenticateUser(100L, "admin");

        ResponseEntity<byte[]> response = controller.getImageDirectly("99");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(imageBytes);
        verify(r2StorageService).getObjectBytes("/uploads/owner.jpg");
    }

    @Test
    void rejectsNonOwnerDirectImageBeforeReadingStorage() {
        Submission submission = submissionWithImage();
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));
        authenticateUser(100L, "user");

        ResponseEntity<byte[]> response = controller.getImageDirectly("99");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(r2StorageService, never()).getObjectBytes(anyString());
    }

    @Test
    void rejectsNormalUploadWhenAuthenticatedUserDoesNotOwnSubmission() throws Exception {
        Submission submission = anonymousSubmission();
        when(submissionRepository.findById(99L)).thenReturn(Optional.of(submission));
        authenticateUser(100L, "user");

        ResponseEntity<FileUploadResponseDTO> response = controller.uploadImageToSubmission(
                "99",
                new MockMultipartFile("file", "photo.jpg", "image/jpeg", "image".getBytes())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(storageService, never()).storeFileWithDimensions(any(), any(), any(), any());
    }

    @Test
    void localHeroUploadDelegatesToLocalStorageService() throws Exception {
        LocalStorageService localService = mock(LocalStorageService.class);
        when(localService.storeHeroImage(any())).thenReturn("/uploads/hero.png");
        FileUploadController localController = new FileUploadController(
                localService,
                new SubmissionUploadService(submissionRepository),
                r2StorageService,
                localService,
                anonymousUploadTokenService
        );

        ResponseEntity<Map<String, Object>> response = localController.uploadHeroImage(
                new MockMultipartFile("file", "hero.jpg/../../evil.png", "image/png", "image".getBytes())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("url", "/uploads/hero.png");
        verify(localService).storeHeroImage(any());
    }

    @Test
    void localHeroUploadDoesNotExposeStorageExceptionText() throws Exception {
        LocalStorageService localService = mock(LocalStorageService.class);
        when(localService.storeHeroImage(any()))
                .thenThrow(new IllegalArgumentException("<script>alert(1)</script>"));
        FileUploadController localController = new FileUploadController(
                localService,
                new SubmissionUploadService(submissionRepository),
                r2StorageService,
                localService,
                anonymousUploadTokenService
        );

        ResponseEntity<Map<String, Object>> response = localController.uploadHeroImage(
                new MockMultipartFile("file", "hero.jpg/../../evil.png", "image/png", "image".getBytes())
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("error", "Hero image upload request is invalid");
        assertThat(response.getBody().toString()).doesNotContain("<script>");
    }

    private Submission anonymousSubmission() {
        Issue issue = new Issue(
                "Street Corners",
                "Photograph a corner of Munich",
                LocalDateTime.now().minusDays(1),
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(2),
                LocalDateTime.now().plusDays(3)
        );
        ReflectionTestUtils.setField(issue, "id", 7L);

        User user = new User();
        ReflectionTestUtils.setField(user, "id", 42L);
        user.setEmail("anonymous-submission-test@anonymous.munichweekly.local");
        user.setNickname("Anonymous");
        user.setAccountType(User.ACCOUNT_TYPE_ANONYMOUS_SUBMISSION);

        Submission submission = new Submission(user, issue, null, "Description");
        ReflectionTestUtils.setField(submission, "id", 99L);
        return submission;
    }

    private Submission submissionWithImage() {
        Submission submission = anonymousSubmission();
        submission.setImageUrl("/uploads/owner.jpg");
        return submission;
    }

    private void authenticateUser(Long userId, String role) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", userId);
        user.setRole(role);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user,
                null,
                List.of(new SimpleGrantedAuthority(role))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
