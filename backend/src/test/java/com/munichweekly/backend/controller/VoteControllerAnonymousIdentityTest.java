package com.munichweekly.backend.controller;

import com.munichweekly.backend.config.AnonymousVoteIdentityProperties;
import com.munichweekly.backend.model.Issue;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.service.AnonymousVoteIdentityService;
import com.munichweekly.backend.service.VoteService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class VoteControllerAnonymousIdentityTest {

    private static final String SECRET = "test-anonymous-vote-secret-32-bytes-minimum";
    private static final Instant NOW = Instant.parse("2026-06-08T12:00:00Z");

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void anonymousVoteUsesSignedCookieSubjectAndIgnoresChangedLegacyVisitorId() {
        VoteService voteService = mock(VoteService.class);
        AnonymousVoteIdentityService identityService = identityService();
        VoteController controller = new VoteController(voteService, identityService, 200);
        Submission submission = approvedSubmission(11L);
        when(voteService.requireSubmissionForVote(11L)).thenReturn(submission);
        when(voteService.vote(eq("signed-subject"), eq(submission), eq("203.0.113.10")))
                .thenReturn(vote("signed-subject", submission));
        when(voteService.countVotesForSubmission(submission)).thenReturn(1);
        String signedCookie = identityService.createTokenForTest("signed-subject", NOW);

        ResponseEntity<?> response = controller.vote(
                11L,
                signedCookie,
                "changed-legacy-visitor",
                request("203.0.113.10"),
                new MockHttpServletResponse()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(voteService).vote("signed-subject", submission, "203.0.113.10");
        verify(voteService, never()).vote(eq("changed-legacy-visitor"), any(), any());
    }

    @Test
    void anonymousVoteWithoutCookiesReceivesSignedCookieAndUsesServerSubject() {
        VoteService voteService = mock(VoteService.class);
        AnonymousVoteIdentityService identityService = identityService();
        VoteController controller = new VoteController(voteService, identityService, 200);
        Submission submission = approvedSubmission(12L);
        ArgumentCaptor<String> subjectCaptor = ArgumentCaptor.forClass(String.class);
        when(voteService.requireSubmissionForVote(12L)).thenReturn(submission);
        when(voteService.vote(subjectCaptor.capture(), eq(submission), eq("203.0.113.11")))
                .thenAnswer(invocation -> vote(invocation.getArgument(0), submission));
        when(voteService.countVotesForSubmission(submission)).thenReturn(1);
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();

        ResponseEntity<?> response = controller.vote(
                12L,
                null,
                null,
                request("203.0.113.11"),
                servletResponse
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(subjectCaptor.getValue()).startsWith("anon_");
        assertThat(servletResponse.getHeaders(HttpHeaders.SET_COOKIE))
                .anySatisfy(header -> assertThat(header)
                        .contains(AnonymousVoteIdentityService.COOKIE_NAME + "=")
                        .contains("HttpOnly"));
    }

    @Test
    void legacyVisitorIdMigratesForVoteStatusWhenSignedCookieIsMissing() {
        VoteService voteService = mock(VoteService.class);
        AnonymousVoteIdentityService identityService = identityService();
        VoteController controller = new VoteController(voteService, identityService, 200);
        Submission submission = approvedSubmission(13L);
        when(voteService.requireSubmissionForVote(13L)).thenReturn(submission);
        when(voteService.hasVoted("legacy-visitor-1", submission)).thenReturn(true);
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();

        ResponseEntity<?> response = controller.hasVoted(
                13L,
                null,
                "legacy-visitor-1",
                request("203.0.113.12"),
                servletResponse
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of("voted", true));
        assertThat(servletResponse.getHeaders(HttpHeaders.SET_COOKIE))
                .anySatisfy(header -> assertThat(header)
                        .contains(AnonymousVoteIdentityService.COOKIE_NAME + "=")
                        .contains("HttpOnly"));
    }

    @Test
    void voteStatusWithoutAnyCookieReturnsFalseWithoutIssuingAnonymousToken() {
        VoteService voteService = mock(VoteService.class);
        AnonymousVoteIdentityService identityService = identityService();
        VoteController controller = new VoteController(voteService, identityService, 200);
        MockHttpServletResponse servletResponse = new MockHttpServletResponse();

        ResponseEntity<?> response = controller.hasVoted(
                13L,
                null,
                null,
                request("203.0.113.12"),
                servletResponse
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of("voted", false));
        assertThat(servletResponse.getHeaders(HttpHeaders.SET_COOKIE)).isEmpty();
        verify(voteService, never()).requireSubmissionForVote(13L);
    }

    @Test
    void repeatedCookieLessVoteStatusChecksDoNotConsumeTokenIssuanceQuota() {
        VoteService voteService = mock(VoteService.class);
        AnonymousVoteIdentityProperties properties = identityProperties();
        properties.setTokenIssuanceMaxAttempts(1);
        AnonymousVoteIdentityService identityService = identityService(properties);
        VoteController controller = new VoteController(voteService, identityService, 200);

        controller.hasVoted(13L, null, null, request("203.0.113.12"), new MockHttpServletResponse());
        ResponseEntity<?> response =
                controller.hasVoted(13L, null, null, request("203.0.113.12"), new MockHttpServletResponse());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of("voted", false));
        verify(voteService, never()).requireSubmissionForVote(13L);
    }

    @Test
    void loggedInVoteUsesUserIdAndDoesNotResolveAnonymousIdentity() {
        VoteService voteService = mock(VoteService.class);
        AnonymousVoteIdentityService identityService = mock(AnonymousVoteIdentityService.class);
        VoteController controller = new VoteController(voteService, identityService, 200);
        Submission submission = approvedSubmission(14L);
        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of())
        );
        when(voteService.requireSubmissionForVote(14L)).thenReturn(submission);
        when(voteService.voteAsUser(7L, submission, "203.0.113.13"))
                .thenReturn(vote("user_7", submission));
        when(voteService.countVotesForSubmission(submission)).thenReturn(1);

        ResponseEntity<?> response = controller.vote(
                14L,
                "bad-anonymous-cookie",
                "legacy-visitor",
                request("203.0.113.13"),
                new MockHttpServletResponse()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(voteService).voteAsUser(7L, submission, "203.0.113.13");
        verifyNoInteractions(identityService);
    }

    @Test
    void anonymousCancelUsesSignedCookieSubject() {
        VoteService voteService = mock(VoteService.class);
        AnonymousVoteIdentityService identityService = identityService();
        VoteController controller = new VoteController(voteService, identityService, 200);
        Submission submission = approvedSubmission(15L);
        when(voteService.requireSubmissionForVote(15L)).thenReturn(submission);
        when(voteService.cancelVote("signed-subject", submission)).thenReturn(true);
        when(voteService.countVotesForSubmission(submission)).thenReturn(0);
        String signedCookie = identityService.createTokenForTest("signed-subject", NOW);

        ResponseEntity<?> response = controller.cancelVote(
                15L,
                signedCookie,
                "changed-legacy-visitor",
                request("203.0.113.14"),
                new MockHttpServletResponse()
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(Map.of("success", true, "voteCount", 0));
        verify(voteService).cancelVote("signed-subject", submission);
        verify(voteService, never()).cancelVote("changed-legacy-visitor", submission);
    }

    private static AnonymousVoteIdentityService identityService() {
        return identityService(identityProperties());
    }

    private static AnonymousVoteIdentityService identityService(AnonymousVoteIdentityProperties properties) {
        return new AnonymousVoteIdentityService(
                properties,
                Clock.fixed(NOW, ZoneOffset.UTC),
                () -> new String[0]
        );
    }

    private static AnonymousVoteIdentityProperties identityProperties() {
        AnonymousVoteIdentityProperties properties = new AnonymousVoteIdentityProperties();
        properties.setSecret(SECRET);
        properties.setCookieSecure(false);
        properties.setTokenIssuanceMaxAttempts(50);
        properties.setTokenIssuanceWindowSeconds(600);
        properties.setVoteAttemptMaxAttempts(200);
        properties.setVoteAttemptWindowSeconds(600);
        return properties;
    }

    private static MockHttpServletRequest request(String remoteAddress) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(remoteAddress);
        return request;
    }

    private static Submission approvedSubmission(Long submissionId) {
        Issue issue = new Issue();
        issue.setVotingStart(LocalDateTime.now().minusDays(1));
        issue.setVotingEnd(LocalDateTime.now().plusDays(1));
        Submission submission = new Submission();
        submission.setId(submissionId);
        submission.setIssue(issue);
        submission.setStatus("approved");
        return submission;
    }

    private static Vote vote(String anonymousSubject, Submission submission) {
        Vote vote = new Vote();
        vote.setId(99L);
        vote.setVisitorId(anonymousSubject);
        vote.setSubmission(submission);
        vote.setIssue(submission.getIssue());
        return vote;
    }
}
