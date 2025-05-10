package com.munichweekly.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a single vote by a user on a submission in a specific issue.
 * Each user can vote once per submission.
 */
@Entity
@Table(name = "votes", uniqueConstraints = @UniqueConstraint(columnNames = {"visitorId", "submission_id"}))
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "submission_id")
    private Submission submission;

    @ManyToOne(optional = false)
    @JoinColumn(name = "issue_id")
    private Issue issue;

    @Column(nullable = false)
    private String visitorId;

    @Column(nullable = true)
    private String browserFingerprint;

    @Column(nullable = true)
    private String ipAddress;

    private LocalDateTime votedAt;

    public Vote() {}

    public Vote(Long id, Submission submission, Issue issue, String visitorId, String browserFingerprint, String ipAddress, LocalDateTime votedAt) {
        this.id = id;
        this.submission = submission;
        this.issue = issue;
        this.visitorId = visitorId;
        this.browserFingerprint = browserFingerprint;
        this.ipAddress = ipAddress;
        this.votedAt = votedAt;
    }

    // Getters & setters ...

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Submission getSubmission() {
        return submission;
    }

    public void setSubmission(Submission submission) {
        this.submission = submission;
    }

    public Issue getIssue() {
        return issue;
    }

    public void setIssue(Issue issue) {
        this.issue = issue;
    }

    public LocalDateTime getVotedAt() {
        return votedAt;
    }

    public void setVotedAt(LocalDateTime votedAt) {
        this.votedAt = votedAt;
    }

    public String getVisitorId() {
        return visitorId;
    }

    public void setVisitorId(String visitorId) {
        this.visitorId = visitorId;
    }

    public String getBrowserFingerprint() {
        return browserFingerprint;
    }

    public void setBrowserFingerprint(String browserFingerprint) {
        this.browserFingerprint = browserFingerprint;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}