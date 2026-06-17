package com.munichweekly.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalStorageServiceTest {

    @TempDir
    Path uploadsDirectory;

    private LocalStorageService service;

    @BeforeEach
    void setUp() {
        service = new LocalStorageService();
        ReflectionTestUtils.setField(service, "uploadsDirectory", uploadsDirectory.toString());
        service.init();
    }

    @Test
    void storesSubmissionFileUnderUploadRootWithSafeSegments() throws Exception {
        StorageService.StorageResult result = service.storeFileWithDimensions(
                imageFile("photo.jpg", "image/jpeg"),
                "7",
                "42",
                "99"
        );

        assertThat(result.getUrl()).isEqualTo("/uploads/issues/7/submissions/99.jpg");
        assertThat(Files.exists(uploadsDirectory.resolve("issues/7/submissions/99.jpg"))).isTrue();
    }

    @Test
    void rejectsTraversalInIssueIdBeforeWritingFile() {
        assertThatThrownBy(() -> service.storeFileWithDimensions(
                imageFile("photo.jpg", "image/jpeg"),
                "../outside",
                "42",
                "99"
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Issue ID");

        assertThat(Files.exists(uploadsDirectory.resolve("outside"))).isFalse();
    }

    @Test
    void rejectsTraversalInSubmissionIdBeforeWritingFile() {
        assertThatThrownBy(() -> service.storeFileWithDimensions(
                imageFile("photo.jpg", "image/jpeg"),
                "7",
                "42",
                "../outside"
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Submission ID");

        assertThat(Files.exists(uploadsDirectory.resolve("issues/7/submissions/outside.jpg"))).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/uploads/../secret.txt",
            "/uploads/%2fsecret.txt",
            "/uploads/%5csecret.txt",
            "/uploads/issues\\7\\secret.jpg",
            "/tmp/secret.txt",
            "C:/secret.txt",
            "/uploads/issues//secret.jpg",
            "/uploads/./secret.txt",
            "/uploads/issues/../secret.txt",
            "/uploads/issues/\0/secret.jpg"
    })
    void fileLookupAndDeleteRejectUnsafeUrls(String fileUrl) {
        assertThat(service.fileExists(fileUrl)).isFalse();
        assertThat(service.deleteFile(fileUrl)).isFalse();
    }

    @Test
    void fileLookupAndDeleteAllowValidNestedUploadUrls() throws Exception {
        StorageService.StorageResult result = service.storeFileWithDimensions(
                imageFile("photo.jpg", "image/jpeg"),
                "7",
                "42",
                "99"
        );

        assertThat(service.fileExists(result.getUrl())).isTrue();
        assertThat(service.deleteFile(result.getUrl())).isTrue();
        assertThat(service.fileExists(result.getUrl())).isFalse();
    }

    @Test
    void heroImageUsesFixedFilenameFromContentType() throws Exception {
        String url = service.storeHeroImage(imageFile("hero.jpg/../../evil.png", "image/png"));

        assertThat(url).isEqualTo("/uploads/hero.png");
        assertThat(Files.exists(uploadsDirectory.resolve("hero.png"))).isTrue();
        assertThat(Files.exists(uploadsDirectory.resolve("evil.png"))).isFalse();
    }

    private MockMultipartFile imageFile(String filename, String contentType) {
        return new MockMultipartFile("file", filename, contentType, "image".getBytes());
    }
}
