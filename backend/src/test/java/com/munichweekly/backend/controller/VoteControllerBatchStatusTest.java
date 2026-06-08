package com.munichweekly.backend.controller;

import com.munichweekly.backend.config.AnonymousVoteIdentityProperties;
import com.munichweekly.backend.service.AnonymousVoteIdentityService;
import com.munichweekly.backend.service.VoteService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class VoteControllerBatchStatusTest {

    private static final String SECRET = "test-anonymous-vote-secret-32-bytes-minimum";
    private static final Instant NOW = Instant.parse("2026-06-08T12:00:00Z");

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void overLimitBatchRequestReturnsBadRequestBeforeServiceWork() {
        VoteService voteService = mock(VoteService.class);
        VoteController controller = new VoteController(voteService, identityService(), 2);

        ResponseEntity<?> response = controller.hasBatchVoted(
                "1,2,3",
                null,
                "visitor-1",
                request(),
                new MockHttpServletResponse()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo("Too many submission IDs (max 2)");
        verify(voteService, never()).batchVoteStatuses(any(), any(), any());
    }

    @Test
    void duplicateIdsAreNormalizedBeforeServiceLookup() {
        VoteService voteService = mock(VoteService.class);
        VoteController controller = new VoteController(voteService, identityService(), 3);
        Map<String, Boolean> statuses = new LinkedHashMap<>();
        statuses.put("1", true);
        statuses.put("2", false);
        when(voteService.batchVoteStatuses(any(), eq(Optional.empty()), eq(Optional.of("visitor-1"))))
                .thenReturn(new VoteService.BatchVoteStatusResult(statuses, 2));

        ResponseEntity<?> response = controller.hasBatchVoted(
                "1, 1, 2,2",
                null,
                "visitor-1",
                request(),
                new MockHttpServletResponse()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body).containsEntry("totalChecked", 2);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Long>> idsCaptor = ArgumentCaptor.forClass((Class) List.class);
        verify(voteService).batchVoteStatuses(idsCaptor.capture(), eq(Optional.empty()), eq(Optional.of("visitor-1")));
        assertThat(idsCaptor.getValue()).containsExactly(1L, 2L);
    }

    @Test
    void missingIdentityReturnsFalseForNormalizedIdsWithoutServiceWork() {
        VoteService voteService = mock(VoteService.class);
        VoteController controller = new VoteController(voteService, identityService(), 3);
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();

        ResponseEntity<?> response = controller.hasBatchVoted(
                "1,1,999",
                null,
                null,
                request(),
                servletResponse
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body).containsEntry("totalChecked", 2);
        assertThat(body.get("statuses")).isEqualTo(Map.of(
                "1", false,
                "999", false
        ));
        assertThat(servletResponse.getHeaders("Set-Cookie")).isEmpty();
        verify(voteService, never()).batchVoteStatuses(any(), any(), any());
    }

    private static AnonymousVoteIdentityService identityService() {
        AnonymousVoteIdentityProperties properties = new AnonymousVoteIdentityProperties();
        properties.setSecret(SECRET);
        properties.setCookieSecure(false);
        properties.setTokenIssuanceMaxAttempts(50);
        properties.setTokenIssuanceWindowSeconds(600);
        properties.setVoteAttemptMaxAttempts(200);
        properties.setVoteAttemptWindowSeconds(600);
        return new AnonymousVoteIdentityService(
                properties,
                Clock.fixed(NOW, ZoneOffset.UTC),
                () -> new String[0]
        );
    }

    private static MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.20");
        return request;
    }
}
