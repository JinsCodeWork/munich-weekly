package com.munichweekly.backend.controller;

import com.munichweekly.backend.devtools.annotation.Description;
import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.service.AnonymousVoteIdentityService;
import com.munichweekly.backend.service.VoteService;
import com.munichweekly.backend.security.CurrentUserUtil;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Arrays;

@RestController
@RequestMapping("/api/votes")
@Tag(name = "Votes", description = "Vote submission and vote status endpoints")
public class VoteController {
    private static final Logger logger = LoggerFactory.getLogger(VoteController.class);
    private static final String CSRF_HEADER_DESCRIPTION =
            "Required for browser clients using cookie-backed anonymous voting. "
                    + "Bearer-authenticated API clients are exempt.";

    private final VoteService voteService;
    private final AnonymousVoteIdentityService anonymousVoteIdentityService;
    private final int batchStatusMaxSubmissionIds;

    public VoteController(
            VoteService voteService,
            AnonymousVoteIdentityService anonymousVoteIdentityService,
            @Value("${votes.batch-status.max-submission-ids:200}") int batchStatusMaxSubmissionIds
    ) {
        this.voteService = voteService;
        this.anonymousVoteIdentityService = anonymousVoteIdentityService;
        this.batchStatusMaxSubmissionIds = Math.max(1, batchStatusMaxSubmissionIds);
    }

    /**
     * Submit a vote for a submission.
     * For authenticated users, we use their userId.
     * For anonymous users, we use the backend-managed signed vote identity.
     * Returns the vote object and current vote count.
     */
    @Description("Submit a vote for a submission. Uses userId for authenticated users and a signed anonymous vote cookie for anonymous users.")
    @Operation(
            summary = "Submit a vote",
            description = "Creates a vote for the current authenticated user or anonymous visitor.",
            parameters = {
                    @Parameter(
                            name = "X-XSRF-TOKEN",
                            in = ParameterIn.HEADER,
                            required = false,
                            schema = @Schema(type = "string"),
                            description = CSRF_HEADER_DESCRIPTION
                    )
            }
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Vote created"),
            @ApiResponse(responseCode = "403", description = "Missing or invalid CSRF token for cookie-backed vote mutation")
    })
    @PostMapping
    public ResponseEntity<?> vote(
            @RequestParam Long submissionId,
            @CookieValue(name = AnonymousVoteIdentityService.COOKIE_NAME, required = false) String signedAnonymousCookie,
            @CookieValue(name = "visitorId", required = false) String legacyVisitorId,
            HttpServletRequest request,
            HttpServletResponse servletResponse) {

        // Get current user ID if logged in
        Optional<Long> currentUserId = CurrentUserUtil.getCurrentUserId();
        
        logger.info("Submit vote: submissionId={}, authenticated={}",
                 submissionId, currentUserId.isPresent());

        Submission submission = voteService.requireSubmissionForVote(submissionId);

        String ipAddress = request.getRemoteAddr();

        Vote vote;
        if (currentUserId.isPresent()) {
            vote = voteService.voteAsUser(currentUserId.get(), submission, ipAddress);
            logger.info("User vote successful: userId={}, submissionId={}", currentUserId.get(), submissionId);
        } else {
            AnonymousVoteIdentityService.Resolution anonymousIdentity =
                    anonymousVoteIdentityService.resolveOrIssue(
                            signedAnonymousCookie,
                            legacyVisitorId,
                            request,
                            servletResponse
                    );
            anonymousVoteIdentityService.checkAndRecordAnonymousVoteAttempt(submissionId, request);
            vote = voteService.vote(anonymousIdentity.subject(), submission, ipAddress);
            logger.info("Anonymous vote successful: anonymousIdentity={}, source={}, submissionId={}",
                    identityForLog(anonymousIdentity.subject()), anonymousIdentity.source(), submissionId);
        }
        
        int currentVoteCount = voteService.countVotesForSubmission(submission);
        
        // Create response with vote and count
        Map<String, Object> response = new HashMap<>();
        response.put("vote", voteResponse(vote));
        response.put("voteCount", currentVoteCount);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Check whether a user has already voted for a specific submission.
     * For authenticated users, we check by userId.
     * For anonymous users, we check by the backend-managed signed vote identity.
     */
    @Description("Check if current user has voted for a submission.")
    @GetMapping("/check")
    public ResponseEntity<?> hasVoted(
            @RequestParam Long submissionId,
            @CookieValue(name = AnonymousVoteIdentityService.COOKIE_NAME, required = false) String signedAnonymousCookie,
            @CookieValue(name = "visitorId", required = false) String legacyVisitorId,
            HttpServletRequest request,
            HttpServletResponse servletResponse) {

        // Get current user ID if logged in
        Optional<Long> currentUserId = CurrentUserUtil.getCurrentUserId();
        
        logger.debug("Check vote status: submissionId={}, authenticated={}",
                   submissionId, currentUserId.isPresent());

        AnonymousVoteIdentityService.Resolution anonymousIdentity = null;
        if (currentUserId.isEmpty()) {
            Optional<AnonymousVoteIdentityService.Resolution> resolvedIdentity =
                    anonymousVoteIdentityService.resolveExistingOrMigrate(
                    signedAnonymousCookie,
                    legacyVisitorId,
                    request,
                    servletResponse
            );
            if (resolvedIdentity.isEmpty()) {
                logger.debug("No existing anonymous vote identity for status check, assuming not voted");
                return ResponseEntity.ok(Map.of("voted", false));
            }
            anonymousIdentity = resolvedIdentity.get();
        }

        Submission submission = voteService.requireSubmissionForVote(submissionId);
        boolean voted;
        if (currentUserId.isPresent()) {
            voted = voteService.hasVotedAsUser(currentUserId.get(), submission);
            logger.debug("User vote check: userId={}, submissionId={}, voted={}", 
                       currentUserId.get(), submissionId, voted);
        } else {
            voted = voteService.hasVoted(anonymousIdentity.subject(), submission);
            logger.debug("Anonymous vote check: anonymousIdentity={}, submissionId={}, voted={}",
                       identityForLog(anonymousIdentity.subject()), submissionId, voted);
        }

        return ResponseEntity.ok(Map.of("voted", voted));
    }

    /**
     * Batch check whether a user has voted for multiple submissions.
     * 
     * This is a performance optimization endpoint that reduces N individual API calls 
     * to 1 batch call when checking vote status for multiple submissions.
     * 
     * For authenticated users, we check by userId.
     * For anonymous users, we check by the backend-managed signed vote identity.
     * 
     * @param submissionIds Comma-separated list of submission IDs to check
     * @return Map of submission IDs to their voted status and total checked count
     */
    @Description("Batch check if current user has voted for multiple submissions. Performance optimization for vote page.")
    @Operation(
            summary = "Batch check vote status",
            description = "Checks whether the current authenticated user or anonymous visitor has voted for a capped list of submissions."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Vote status check completed"),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid or too many submission IDs",
                    content = @Content(
                            mediaType = "text/plain",
                            schema = @Schema(implementation = String.class)
                    )
            )
    })
    @GetMapping("/check-batch")
    public ResponseEntity<?> hasBatchVoted(
            @RequestParam String submissionIds,
            @CookieValue(name = AnonymousVoteIdentityService.COOKIE_NAME, required = false) String signedAnonymousCookie,
            @CookieValue(name = "visitorId", required = false) String legacyVisitorId,
            HttpServletRequest request,
            HttpServletResponse servletResponse) {

        List<Long> normalizedSubmissionIds;
        try {
            normalizedSubmissionIds = normalizeSubmissionIds(submissionIds);
        } catch (NumberFormatException e) {
            logger.warn("Invalid submission IDs format for batch vote status check");
            return ResponseEntity.badRequest().body("Invalid submission IDs format");
        }

        if (normalizedSubmissionIds.size() > batchStatusMaxSubmissionIds) {
            logger.warn("Batch vote status check rejected: normalizedIdCount={} max={}",
                    normalizedSubmissionIds.size(), batchStatusMaxSubmissionIds);
            return ResponseEntity.badRequest()
                    .body("Too many submission IDs (max " + batchStatusMaxSubmissionIds + ")");
        }

        if (normalizedSubmissionIds.isEmpty()) {
            logger.debug("No submission IDs provided for batch check");
            return ResponseEntity.ok(Map.of("statuses", Map.of(), "totalChecked", 0));
        }

        Optional<Long> currentUserId = CurrentUserUtil.getCurrentUserId();

        logger.info("Batch vote status check: normalizedIdCount={}, authenticated={}",
                   normalizedSubmissionIds.size(), currentUserId.isPresent());

        AnonymousVoteIdentityService.Resolution anonymousIdentity = null;
        if (currentUserId.isEmpty()) {
            Optional<AnonymousVoteIdentityService.Resolution> resolvedIdentity =
                    anonymousVoteIdentityService.resolveExistingOrMigrate(
                    signedAnonymousCookie,
                    legacyVisitorId,
                    request,
                    servletResponse
            );
            if (resolvedIdentity.isEmpty()) {
                logger.debug("No existing anonymous vote identity for batch check, assuming all not voted");
                Map<String, Boolean> statuses = falseStatuses(normalizedSubmissionIds);
                return ResponseEntity.ok(Map.of("statuses", statuses, "totalChecked", normalizedSubmissionIds.size()));
            }
            anonymousIdentity = resolvedIdentity.get();
        }

        VoteService.BatchVoteStatusResult batchResult =
                voteService.batchVoteStatuses(
                        normalizedSubmissionIds,
                        currentUserId,
                        Optional.ofNullable(anonymousIdentity).map(AnonymousVoteIdentityService.Resolution::subject)
                );

        logger.info("Batch vote status check completed: checked={}/{} submissions, authenticated={}, anonymousIdentity={}",
                   batchResult.totalChecked(), normalizedSubmissionIds.size(), currentUserId.isPresent(),
                   anonymousIdentity == null ? null : identityForLog(anonymousIdentity.subject()));

        Map<String, Object> response = new HashMap<>();
        response.put("statuses", batchResult.statuses());
        response.put("totalChecked", batchResult.totalChecked());
        
        return ResponseEntity.ok(response);
    }

    private List<Long> normalizeSubmissionIds(String submissionIds) {
        if (submissionIds == null || submissionIds.isBlank()) {
            return List.of();
        }
        return Arrays.stream(submissionIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::valueOf)
                .distinct()
                .limit((long) batchStatusMaxSubmissionIds + 1)
                .toList();
    }

    private static Map<String, Boolean> falseStatuses(List<Long> submissionIds) {
        Map<String, Boolean> statuses = new LinkedHashMap<>();
        for (Long submissionId : submissionIds) {
            statuses.put(submissionId.toString(), false);
        }
        return statuses;
    }

    /**
     * Cancel a vote for a submission.
     * For authenticated users, we use their userId.
     * For anonymous users, we use the backend-managed signed vote identity.
     * Returns success status and updated vote count.
     */
    @Description("Cancel a vote for a submission. Uses userId for authenticated users and a signed anonymous vote cookie for anonymous users.")
    @Operation(
            summary = "Cancel a vote",
            description = "Cancels a vote for the current authenticated user or anonymous visitor.",
            parameters = {
                    @Parameter(
                            name = "X-XSRF-TOKEN",
                            in = ParameterIn.HEADER,
                            required = false,
                            schema = @Schema(type = "string"),
                            description = CSRF_HEADER_DESCRIPTION
                    )
            }
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Vote cancellation processed"),
            @ApiResponse(
                    responseCode = "400",
                    description = "Vote cannot be cancelled",
                    content = @Content(
                            mediaType = "text/plain",
                            schema = @Schema(implementation = String.class)
                    )
            ),
            @ApiResponse(responseCode = "403", description = "Missing or invalid CSRF token for cookie-backed vote mutation")
    })
    @DeleteMapping
    public ResponseEntity<?> cancelVote(
            @RequestParam Long submissionId,
            @CookieValue(name = AnonymousVoteIdentityService.COOKIE_NAME, required = false) String signedAnonymousCookie,
            @CookieValue(name = "visitorId", required = false) String legacyVisitorId,
            HttpServletRequest request,
            HttpServletResponse servletResponse) {

        // Get current user ID if logged in
        Optional<Long> currentUserId = CurrentUserUtil.getCurrentUserId();
        
        logger.info("Cancel vote: submissionId={}, authenticated={}",
                   submissionId, currentUserId.isPresent());

        Submission submission = voteService.requireSubmissionForVote(submissionId);

        try {
            boolean success;
            if (currentUserId.isPresent()) {
                logger.info("Attempting to cancel user vote: userId={}, submissionId={}", 
                         currentUserId.get(), submissionId);
                success = voteService.cancelVoteAsUser(currentUserId.get(), submission);
                logger.info("User vote cancelled: userId={}, submissionId={}, success={}", 
                         currentUserId.get(), submissionId, success);
            } else {
                AnonymousVoteIdentityService.Resolution anonymousIdentity =
                        anonymousVoteIdentityService.resolveOrIssue(
                                signedAnonymousCookie,
                                legacyVisitorId,
                                request,
                                servletResponse
                        );
                logger.info("Attempting to cancel anonymous vote: anonymousIdentity={}, source={}, submissionId={}",
                         identityForLog(anonymousIdentity.subject()), anonymousIdentity.source(), submissionId);
                success = voteService.cancelVote(anonymousIdentity.subject(), submission);
                logger.info("Anonymous vote cancelled: anonymousIdentity={}, submissionId={}, success={}",
                         identityForLog(anonymousIdentity.subject()), submissionId, success);
            }
            
            int updatedVoteCount = voteService.countVotesForSubmission(submission);
            
            // Create response with success status and updated count
            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("voteCount", updatedVoteCount);
            
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            logger.error("Failed to cancel vote: submissionId={}, userId={}, error={}",
                       submissionId, currentUserId.orElse(null), e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private static Map<String, Object> voteResponse(Vote vote) {
        Long submissionId = vote.getSubmission() == null ? null : vote.getSubmission().getId();
        Map<String, Object> response = new HashMap<>();
        response.put("id", vote.getId());
        response.put("submissionId", submissionId);
        return response;
    }

    private static String identityForLog(String identity) {
        if (identity == null || identity.isBlank()) {
            return "none";
        }
        return "len=" + identity.length() + ",hash=" + Integer.toHexString(identity.hashCode());
    }
}
