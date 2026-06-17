package com.munichweekly.backend.controller;

import com.munichweekly.backend.dto.FileUploadResponseDTO;
import com.munichweekly.backend.service.PromotionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PromotionControllerTest {

    private PromotionService promotionService;
    private PromotionController controller;

    @BeforeEach
    void setUp() {
        promotionService = mock(PromotionService.class);
        controller = new PromotionController(promotionService);
    }

    @Test
    void uploadPromotionImageReturnsJsonUploadResponse() throws Exception {
        MockMultipartFile file = imageFile("promotion.jpg", "image/jpeg");
        when(promotionService.uploadPromotionImageFile(eq(5L), any()))
                .thenReturn("/uploads/issues/promotion/submissions/5.jpg");

        ResponseEntity<FileUploadResponseDTO> response = controller.uploadPromotionImageFile(5L, file);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getImageUrl()).isEqualTo("/uploads/issues/promotion/submissions/5.jpg");
        assertThat(response.getBody().getError()).isNull();
    }

    @Test
    void uploadPromotionImageDoesNotExposeServiceExceptionText() throws Exception {
        MockMultipartFile file = imageFile("promotion.jpg", "image/jpeg");
        when(promotionService.uploadPromotionImageFile(eq(5L), any()))
                .thenThrow(new IllegalArgumentException("<script>alert(1)</script>"));

        ResponseEntity<FileUploadResponseDTO> response = controller.uploadPromotionImageFile(5L, file);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError()).isEqualTo("Promotion image upload request is invalid");
        assertThat(response.getBody().getError()).doesNotContain("<script>");
    }

    private MockMultipartFile imageFile(String filename, String contentType) {
        return new MockMultipartFile("file", filename, contentType, "image".getBytes());
    }
}
