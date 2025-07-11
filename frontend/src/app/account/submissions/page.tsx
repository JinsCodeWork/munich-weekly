"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"
import { issuesApi, submissionsApi } from "@/api"
import { Issue, MySubmissionResponse, SubmissionStatus } from "@/types/submission"
import { SubmissionCard } from "@/components/submission/SubmissionCard"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { Pagination } from "@/components/ui/Pagination"
import { Modal } from "@/components/ui/Modal"
import { cn } from "@/lib/utils"
import { Container } from '@/components/ui/Container'

export default function SubmissionsPage() {
  const { user } = useAuth()
  const [allSubmissions, setAllSubmissions] = useState<MySubmissionResponse[]>([])
  const [displayedSubmissions, setDisplayedSubmissions] = useState<MySubmissionResponse[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<number | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 8
  const [isManageMode, setIsManageMode] = useState(false)
  const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSelectedDeleteDialog, setShowSelectedDeleteDialog] = useState(false)
  const [isFilterChanging, setIsFilterChanging] = useState(false)

  const updateDisplayedSubmissions = useCallback((submissions: MySubmissionResponse[], page: number) => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedItems = submissions.slice(startIndex, endIndex)
    const calculatedTotalPages = Math.ceil(submissions.length / pageSize)
    
    setDisplayedSubmissions(paginatedItems)
    setTotalPages(calculatedTotalPages)
  }, [pageSize])

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setIsFilterChanging(true)
      
      // Clear displayed submissions immediately to prevent stale content
      setDisplayedSubmissions([])
      
      // Get first page to determine total count
      const firstPageResponse = await submissionsApi.getUserSubmissions(selectedIssue, 0, pageSize)
      
      let allSubmissions: MySubmissionResponse[] = []
      
      if (Array.isArray(firstPageResponse)) {
        // If backend returns complete array, use it directly
        allSubmissions = firstPageResponse
      } else {
        // If backend supports pagination, get all pages
        allSubmissions = [...firstPageResponse.content]
        
        // If there are multiple pages, get remaining pages
        if (firstPageResponse.totalPages > 1) {
          for (let page = 1; page < firstPageResponse.totalPages; page++) {
            const additionalResponse = await submissionsApi.getUserSubmissions(selectedIssue, page, pageSize)
            if (!Array.isArray(additionalResponse)) {
              allSubmissions = allSubmissions.concat(additionalResponse.content)
            }
          }
        }
      }
      
      // Sort by submission time (newest first)
      allSubmissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      
      setAllSubmissions(allSubmissions)
      // Don't update displayed submissions here - let the useEffect handle it
    } catch (err) {
      console.error("Failed to load submissions:", err)
      setError("Failed to load submissions, please try again later")
      setAllSubmissions([])
      setDisplayedSubmissions([])
      setTotalPages(1)
    } finally {
      setLoading(false)
      setIsFilterChanging(false)
    }
  }, [selectedIssue, pageSize])  // Remove currentPage and showAllSubmissions dependencies

  const loadIssues = async () => {
    try {
      const issuesData = await issuesApi.getAllIssues()
      // Sort issues by ID in descending order (newest first)
      const sortedIssues = (issuesData || []).sort((a, b) => b.id - a.id)
      setIssues(sortedIssues)
    } catch (err) {
      console.error("Failed to load issues:", err)
      setIssues([])
    }
  }

  // Update displayed submissions when pagination state changes
  useEffect(() => {
    if (allSubmissions.length > 0) {
      updateDisplayedSubmissions(allSubmissions, currentPage)
    }
  }, [currentPage, allSubmissions, updateDisplayedSubmissions])

  // Load submissions when selectedIssue changes
  useEffect(() => {
    if (user) {
      setCurrentPage(1)
      loadSubmissions()
    }
  }, [selectedIssue, user, loadSubmissions])

  // Load issues on mount
  useEffect(() => {
    loadIssues()
  }, [])

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleIssueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedIssue(value === "all" ? undefined : parseInt(value))
    setCurrentPage(1)
  }

  const toggleManageMode = () => {
    setIsManageMode(!isManageMode);
  };

  const handleDeleteClick = useCallback((submissionId: number) => {
    // Find the submission to check its status
    const submission = allSubmissions.find(s => s.id === submissionId);
    
    if (submission && submission.status === 'selected') {
      // For selected submissions, show special dialog requiring email contact
      setSubmissionToDelete(submissionId);
      setShowSelectedDeleteDialog(true);
    } else {
      // For other submissions, show normal delete dialog
      setSubmissionToDelete(submissionId);
      setShowDeleteDialog(true);
    }
  }, [allSubmissions]);

  const handleConfirmDelete = async () => {
    if (submissionToDelete === null) return;
    
    try {
      setIsDeleting(true);
      await submissionsApi.deleteSubmission(submissionToDelete);
      
      const updatedSubmissions = allSubmissions.filter(submission => submission.id !== submissionToDelete)
      setAllSubmissions(updatedSubmissions);
      
      setShowDeleteDialog(false);
      setSubmissionToDelete(null);
    } catch (error) {
      console.error("Error deleting submission:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setSubmissionToDelete(null);
  };

  const handleCancelSelectedDelete = () => {
    setShowSelectedDeleteDialog(false);
    setSubmissionToDelete(null);
  };

  const handleContactForDeletion = () => {
    // Get submission details for email
    const submission = allSubmissions.find(s => s.id === submissionToDelete);
    if (submission) {
      const emailSubject = encodeURIComponent("Request to Delete Selected Photo - Munich Weekly");
      const emailBody = encodeURIComponent(
        `Dear Munich Weekly Team,\n\nI would like to request the deletion of my photo that has been selected for publication.\n\nSubmission ID: ${submission.id}\nPhoto Description: ${submission.description || "No description provided"}\nSubmitted Date: ${new Date(submission.submittedAt).toLocaleDateString()}\n\nReason for deletion request:\n[Please explain your reason here, especially if it involves privacy concerns or personal information]\n\nI understand that this photo has been selected for public exhibition and that deletion may affect publication integrity. I request this deletion in accordance with GDPR Article 17 (Right to Erasure).\n\nThank you for your consideration.\n\nBest regards,\n[Your name]`
      );
      
      window.open(`mailto:contact@munichweekly.art?subject=${emailSubject}&body=${emailBody}`, '_blank');
    }
    
    // Close the dialog
    setShowSelectedDeleteDialog(false);
    setSubmissionToDelete(null);
  };

  const convertToSubmissions = useCallback((mySubmissions: MySubmissionResponse[]) => {
    return mySubmissions.map(submission => {
      const issue = issues.find(issue => 
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

  if (!user) {
    return (
      <Container className="py-10 text-center" spacing="standard">
        <p>Please log in to view your submissions.</p>
      </Container>
    );
  }

  return (
    <Container className="py-8" spacing="standard">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-heading">My Submissions</h1>
            <p className="text-gray-600">
              {allSubmissions.length > 0 
                ? `You have ${allSubmissions.length} submission${allSubmissions.length > 1 ? 's' : ''}`
                : "You haven't submitted any photos yet"
              }
              {totalPages > 1 
                ? ` (page ${currentPage} of ${totalPages}, showing ${displayedSubmissions.length} per page)`
                : ` (showing ${displayedSubmissions.length} submission${displayedSubmissions.length > 1 ? 's' : ''})`
              }
            </p>
          </div>
          
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

      {allSubmissions && allSubmissions.length > 0 && !loading && (
        <div className="mb-6 flex flex-wrap gap-3">
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

      {(loading || isFilterChanging) && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
        </div>
      )}

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

      {!loading && !error && !isFilterChanging && allSubmissions && allSubmissions.length === 0 && (
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

      {!loading && !error && !isFilterChanging && displayedSubmissions && displayedSubmissions.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedSubmissions.map((submission) => {
              const convertedSubmission = convertToSubmissions([submission])[0];
              
              return (
                <div key={submission.id} className="relative group">
                  <SubmissionCard
                    submission={convertedSubmission}
                    displayContext="default"
                    layoutMode="grid"
                    className="h-full"
                  />
                  
                  {isManageMode && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(submission.id);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
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
      
      {/* Normal Delete Dialog */}
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

      {/* Selected Photo Delete Dialog */}
      <Modal
        isOpen={showSelectedDeleteDialog}
        onClose={handleCancelSelectedDelete}
        contentVariant="dark-glass"
      >
        <div className="p-6 text-center max-w-lg">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white font-heading">Selected Photo Deletion Request</h2>
          <div className="text-left text-white mb-6 space-y-3">
            <p className="text-center">
              This photo has been <span className="font-semibold text-yellow-400">selected for publication</span> and is part of our public gallery.
            </p>
            <p>
              According to our privacy policy and GDPR Article 17, you have the right to request deletion of your photos. However, for selected photos that affect publication integrity, we require editorial review.
            </p>
            <p>
              <span className="font-semibold">To request deletion:</span>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
              <li>Click &ldquo;Send Email Request&rdquo; below</li>
              <li>Explain your reason (especially privacy concerns)</li>
              <li>Our editorial team will review within 3-5 business days</li>
            </ul>
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={handleContactForDeletion}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Send Email Request
            </button>
            <button
              type="button"
              onClick={handleCancelSelectedDelete}
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