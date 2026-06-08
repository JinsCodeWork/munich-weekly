package com.munichweekly.backend.service;

import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.Vote;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.repository.VoteRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class VoteServiceTest {

    @Test
    void authenticatedBatchLookupUsesSingleUserVoteQueryAndMarksMissingIdsFalse() {
        VoteRepository voteRepository = mock(VoteRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        VoteService service = new VoteService(voteRepository, submissionRepository);
        List<Long> submissionIds = List.of(1L, 2L, 3L);
        when(voteRepository.findByUserIdAndSubmissionIdIn(7L, submissionIds))
                .thenReturn(List.of(voteForSubmission(2L)));

        VoteService.BatchVoteStatusResult result =
                service.batchVoteStatuses(submissionIds, Optional.of(7L), Optional.empty());

        assertThat(result.totalChecked()).isEqualTo(3);
        assertThat(result.statuses()).containsExactlyInAnyOrderEntriesOf(java.util.Map.of(
                "1", false,
                "2", true,
                "3", false
        ));
        verify(voteRepository).findByUserIdAndSubmissionIdIn(7L, submissionIds);
        verify(voteRepository, never()).existsByUserIdAndSubmission(org.mockito.Mockito.anyLong(), org.mockito.Mockito.any());
        verifyNoInteractions(submissionRepository);
    }

    @Test
    void anonymousBatchLookupUsesSingleVisitorVoteQueryAndMarksMissingIdsFalse() {
        VoteRepository voteRepository = mock(VoteRepository.class);
        SubmissionRepository submissionRepository = mock(SubmissionRepository.class);
        VoteService service = new VoteService(voteRepository, submissionRepository);
        List<Long> submissionIds = List.of(4L, 5L);
        when(voteRepository.findByVisitorIdAndSubmissionIdIn("visitor-1", submissionIds))
                .thenReturn(List.of(voteForSubmission(5L)));

        VoteService.BatchVoteStatusResult result =
                service.batchVoteStatuses(submissionIds, Optional.empty(), Optional.of("visitor-1"));

        assertThat(result.totalChecked()).isEqualTo(2);
        assertThat(result.statuses()).containsExactlyInAnyOrderEntriesOf(java.util.Map.of(
                "4", false,
                "5", true
        ));
        verify(voteRepository).findByVisitorIdAndSubmissionIdIn("visitor-1", submissionIds);
        verify(voteRepository, never()).existsByVisitorIdAndSubmission(org.mockito.Mockito.anyString(), org.mockito.Mockito.any());
        verifyNoInteractions(submissionRepository);
    }

    private static Vote voteForSubmission(Long submissionId) {
        Submission submission = new Submission();
        submission.setId(submissionId);
        Vote vote = new Vote();
        vote.setSubmission(submission);
        return vote;
    }
}
