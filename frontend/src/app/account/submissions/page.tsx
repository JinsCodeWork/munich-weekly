"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"
import { issuesApi, submissionsApi } from "@/api"
import { Issue, MySubmissionResponse, SubmissionStatus } from "@/types/submission"
import { MasonrySubmissionCard } from "@/components/submission/MasonrySubmissionCard"
import { MasonryGallery } from "@/components/ui/MasonryGallery"
import { getImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { Pagination } from "@/components/ui/Pagination"
import { Modal } from "@/components/ui/Modal"
import { cn } from "@/lib/utils"
import { CONTAINER_CONFIG } from '@/styles/components/container'
import { Container } from '@/components/ui/Container'

export default function SubmissionsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<MySubmissionResponse[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<number | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 16 // Fixed number of submissions per page
  const [isManageMode, setIsManageMode] = useState(false)
  const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Load submissions data
  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("Loading user submissions, page:", currentPage, "filter:", selectedIssue);
      
      // Note: API page index starts from 0, but UI page starts from 1
      const response = await submissionsApi.getUserSubmissions(
        selectedIssue, 
        currentPage - 1, 
        pageSize
      )
      
      if (Array.isArray(response)) {
        // Compatibility handling: if returned as array (API doesn't support pagination yet)
        setSubmissions(response)
        setTotalPages(Math.ceil(response.length / pageSize))
      } else {
        // Handle paginated response
        setSubmissions(response.content)
        setTotalPages(response.totalPages)
      }
      
      console.log("Successfully loaded user submissions:", response)
      
      // Check image URLs
      if ((Array.isArray(response) && response.length > 0) || 
          (!Array.isArray(response) && response.content.length > 0)) {
        const firstSubmission = Array.isArray(response) ? response[0] : response.content[0];
        console.log("First submission details:", {
          id: firstSubmission.id,
          imageUrl: firstSubmission.imageUrl,
          processedUrl: getImageUrl(firstSubmission.imageUrl),
          status: firstSubmission.status
        });
      } else {
        console.log("User has no submissions");
      }
    } catch (err) {
      console.error("Failed to load submissions:", err)
      setError("Failed to load submissions, please try again later")
      setSubmissions([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [selectedIssue, currentPage, pageSize])

  // Load issues data
  const loadIssues = async () => {
    try {
      const issuesData = await issuesApi.getAllIssues()
      setIssues(issuesData || [])
    } catch (err) {
      console.error("Failed to load issues:", err)
      setIssues([])
    }
  }

  // Reload submissions when selected issue changes or page changes
  useEffect(() => {
    if (user) {
      loadSubmissions()
    }
  }, [loadSubmissions, user])

  // Initial load of issues data
  useEffect(() => {
    loadIssues()
  }, [])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Option to scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle issue filter change
  const handleIssueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedIssue(value === "all" ? undefined : parseInt(value))
    setCurrentPage(1) // Reset to first page when changing filter
  }

  // Toggle management mode
  const toggleManageMode = () => {
    setIsManageMode(!isManageMode);
  };

  // Handle delete button click
  const handleDeleteClick = useCallback((submissionId: number) => {
    setSubmissionToDelete(submissionId);
    setShowDeleteDialog(true);
  }, []);

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (submissionToDelete === null) return;
    
    try {
      setIsDeleting(true);
      await submissionsApi.deleteSubmission(submissionToDelete);
      
      // Update UI state after successful deletion
      setSubmissions(prevSubmissions => 
        prevSubmissions.filter(submission => submission.id !== submissionToDelete)
      );
      
      setShowDeleteDialog(false);
      setSubmissionToDelete(null);
    } catch (error) {
      console.error("Error deleting submission:", error);
      // Can show error message
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete operation
  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setSubmissionToDelete(null);
  };

  // Handle submission click for detail view
  const handleSubmissionClick = useCallback((submission: MySubmissionResponse) => {
    if (!isManageMode) {
      console.log('Submission clicked for detail view:', submission.id);
      // Could implement modal detail view or navigation here
    }
  }, [isManageMode]);

  // Convert MySubmissionResponse to Submission for MasonryGallery
  const convertToSubmissions = useCallback((mySubmissions: MySubmissionResponse[]) => {
    return mySubmissions.map(submission => {
      // Find the corresponding issue
      const issue = issues.find(issue => 
        // Try to extract issue ID from image URL, if not possible use first issue as default
        submission.imageUrl && (
          submission.imageUrl.includes(`issues/${issue.id}/`) || 
          submission.imageUrl.includes(`issue${issue.id}`)
        )
      ) || (issues.length > 0 ? issues[0] : {
        id: 1,
        title: "Unknown Issue",
        description: "",
        submissionStart: "",
        submissionEnd: "",
        votingStart: "",
        votingEnd: "",
        createdAt: ""
      });

      return {
        id: submission.id,
        imageUrl: submission.imageUrl,
        description: submission.description,
        status: submission.status as SubmissionStatus,
        submittedAt: submission.submittedAt,
        voteCount: submission.voteCount,
        isCover: submission.isCover,
        issue: issue,
        userId: user?.id || 0
      };
    });
  }, [issues, user?.id]);

  // Render submission with management overlay
  const renderSubmissionWithManagement = useCallback((submission: MySubmissionResponse, isWide: boolean, aspectRatio: number) => {
    const convertedSubmission = convertToSubmissions([submission])[0];
    
    return (
      <div className="relative">
        <MasonrySubmissionCard
          submission={convertedSubmission}
          isWide={isWide}
          aspectRatio={aspectRatio}
          displayContext="default"
          enableHoverEffects={!isManageMode}
        />
        {isManageMode && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(submission.id);
            }}
            className="absolute top-2 left-2 bg-red-500 rounded-full w-8 h-8 flex items-center justify-center text-white hover:bg-red-600 z-10 shadow-md"
            aria-label="Delete"
          >
            <span className="text-xl font-bold leading-none" style={{ marginTop: "-2px" }}>×</span>
          </button>
        )}
      </div>
    );
  }, [convertToSubmissions, isManageMode, handleDeleteClick]);

  return (
    <Container spacing="minimal" className="py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-200 pb-5 mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900 font-heading">My Submissions</h1>
          <p className="mt-2 text-sm text-gray-500">
            View and manage all your submitted photos
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Issue filter */}
          <div className="flex items-center self-start md:self-auto">
            <label htmlFor="issue-filter" className="mr-2 text-sm text-gray-500">
              Filter by Issue:
            </label>
            <select
              id="issue-filter"
              className="border border-gray-300 rounded-md py-1.5 px-3 text-sm flex-1 min-w-[180px]"
              onChange={handleIssueChange}
              value={selectedIssue === undefined ? "all" : selectedIssue}
            >
              <option value="all">All Issues</option>
              {issues && issues.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  Issue {issue.id} - {issue.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Management button */}
      {submissions && submissions.length > 0 && !loading && (
        <div className="mb-6">
          <Button 
            variant={isManageMode ? "danger" : "outline"}
            onClick={toggleManageMode}
            className={cn(
              "border border-red-500 hover:bg-red-50 whitespace-nowrap px-4 min-w-[210px] flex items-center", 
              isManageMode && "bg-red-500 text-white hover:bg-red-600"
            )}
          >
            {isManageMode ? (
              <svg className="w-3.5 h-3.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            )}
            <span className="inline-block">{isManageMode ? 'Exit Management' : 'Manage My Submissions'}</span>
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2 font-heading">
            Error
          </h3>
          <p className="text-red-600 mb-4">
            {error}
          </p>
          <button
            onClick={loadSubmissions}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && submissions && submissions.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2 font-heading">
            You don&apos;t have any submissions yet
          </h3>
          <p className="text-gray-500 mb-4">
            Upload your photos to participate in Munich Weekly
          </p>
          <Link href="/submit">
            <Button variant="primary">
              Upload Photo
            </Button>
          </Link>
        </div>
      )}

      {/* Enhanced MasonryGallery for submissions with account-optimized layout */}
      {!loading && !error && submissions && submissions.length > 0 && (
        <>
          <MasonryGallery
            items={submissions}
            getImageUrl={(submission) => submission.imageUrl}
            renderItem={renderSubmissionWithManagement}
            onItemClick={handleSubmissionClick}
            className="w-full overflow-hidden" 
            config={{
              columnWidth: CONTAINER_CONFIG.accountMasonry.columnWidth,
              gap: CONTAINER_CONFIG.accountMasonry.gap,
              mobileColumns: CONTAINER_CONFIG.accountMasonry.columns.mobile,
              tabletColumns: CONTAINER_CONFIG.accountMasonry.columns.tablet,
              desktopColumns: CONTAINER_CONFIG.accountMasonry.columns.desktop,
            }}
            loadingComponent={
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading your submissions...</p>
              </div>
            }
            emptyComponent={
              <div className="text-center text-gray-500 py-10">
                <p>No submissions found for the selected criteria.</p>
              </div>
            }
            errorComponent={(errors, onRetry) => (
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">
                  <p>Failed to load {errors.length} image(s)</p>
                </div>
                <Button onClick={onRetry} variant="secondary" size="sm">
                  Retry Failed Images
                </Button>
              </div>
            )}
          />
          
          {/* Add pagination component */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showFirstLastButtons
                showPageSelector
                maxVisiblePages={5}
                simplifyOnMobile
              />
            </div>
          )}
        </>
      )}
      
      {/* Delete confirmation dialog */}
      <Modal
        isOpen={showDeleteDialog}
        onClose={handleCancelDelete}
        contentVariant="dark-glass"
      >
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-white font-heading">Delete Photo</h2>
          <p className="mb-4 text-white">Are you sure you want to delete this photo? This action cannot be undone. The photo will be permanently removed from our system.</p>
          <div className="flex justify-center gap-4 mt-6">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : "Yes, Delete Photo"}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleCancelDelete}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </Container>
  )
} 