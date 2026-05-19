package com.munichweekly.backend.service;

import com.munichweekly.backend.model.Submission;
import com.munichweekly.backend.model.User;
import com.munichweekly.backend.repository.SubmissionRepository;
import com.munichweekly.backend.security.CurrentUserUtil;
import org.springframework.stereotype.Service;

/**
 * Submission lookup, upload authorization, and persisting image metadata after storage.
 */
@Service
public class SubmissionUploadService {

    private final SubmissionRepository submissionRepository;

    public SubmissionUploadService(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    /**
     * Load submission by id or throw if not found.
     */
    public Submission requireSubmission(Long submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));
    }

    /**
     * Whether the current security principal may upload to this submission (owner or admin).
     */
    public boolean currentUserMayUpload(Submission submission) {
        User currentUser = CurrentUserUtil.getUser();
        if (currentUser == null) {
            return false;
        }
        boolean isOwner = submission.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = "admin".equals(currentUser.getRole());
        return isOwner || isAdmin;
    }

    public void applyStoredImageAndSave(Submission submission, StorageService.StorageResult storageResult) {
        submission.setImageUrl(storageResult.getUrl());
        if (storageResult.hasDimensions()) {
            submission.setImageDimensions(
                    storageResult.getDimensions().getWidth(),
                    storageResult.getDimensions().getHeight()
            );
        }
        submissionRepository.save(submission);
    }
}
