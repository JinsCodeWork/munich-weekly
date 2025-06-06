"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"
import { issuesApi, submissionsApi } from "@/api"
import { Issue, MySubmissionResponse, SubmissionStatus } from "@/types/submission"
import { SubmissionCard } from "@/components/submission/SubmissionCard"
import { getImageUrl } from "@/lib/utils"
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
  const [showAllSubmissions, setShowAllSubmissions] = useState(false)
  const pageSize = 16
  const [isManageMode, setIsManageMode] = useState(false)
  const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const updateDisplayedSubmissions = useCallback((submissions: MySubmissionResponse[]) => {
    if (showAllSubmissions) {
      setDisplayedSubmissions(submissions)
      setTotalPages(1)
    } else {
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedItems = submissions.slice(startIndex, endIndex)
      setDisplayedSubmissions(paginatedItems)
      setTotalPages(Math.ceil(submissions.length / pageSize))
    }
  }, [currentPage, pageSize, showAllSubmissions])

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("Loading user submissions, filter:", selectedIssue, "showAll:", showAllSubmissions);
      
      const response = await submissionsApi.getUserSubmissions(selectedIssue)
      
      let submissions: MySubmissionResponse[] = []
      if (Array.isArray(response)) {
        submissions = response
      } else {
        submissions = response.content
        if (response.totalPages > 1) {
          for (let page = 1; page < response.totalPages; page++) {
            const additionalResponse = await submissionsApi.getUserSubmissions(selectedIssue, page, pageSize)
            if (!Array.isArray(additionalResponse)) {
              submissions = submissions.concat(additionalResponse.content)
            }
          }
        }
      }
      
      setAllSubmissions(submissions)
      updateDisplayedSubmissions(submissions)
      
      console.log(`Successfully loaded ${submissions.length} user submissions`)
      
      if (submissions.length > 0) {
        const firstSubmission = submissions[0];
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
      setAllSubmissions([])
      setDisplayedSubmissions([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [selectedIssue, showAllSubmissions, updateDisplayedSubmissions])

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

  useEffect(() => {
    updateDisplayedSubmissions(allSubmissions)
  }, [allSubmissions, updateDisplayedSubmissions])

  useEffect(() => {
    if (user) {
      setCurrentPage(1)
      loadSubmissions()
    }
  }, [selectedIssue, user, loadSubmissions])

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

  const toggleShowAllSubmissions = () => {
    setShowAllSubmissions(!showAllSubmissions)
    setCurrentPage(1)
  }

  const toggleManageMode = () => {
    setIsManageMode(!isManageMode);
  };

  const handleDeleteClick = useCallback((submissionId: number) => {
    setSubmissionToDelete(submissionId);
    setShowDeleteDialog(true);
  }, []);

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
              {showAllSubmissions 
                ? " (showing all)" 
                : ` (showing ${displayedSubmissions.length} per page)`
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
          
          {allSubmissions.length > pageSize && (
            <Button 
              variant="outline"
              onClick={toggleShowAllSubmissions}
              className="whitespace-nowrap px-4 flex items-center"
            >
              {showAllSubmissions ? (
                <>
                  <svg className="w-3.5 h-3.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                  </svg>
                  Show Paged View
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="12" x2="15" y2="12"></line>
                    <line x1="12" y1="9" x2="12" y2="15"></line>
                  </svg>
                  Show All ({allSubmissions.length})
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {loading && (
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

      {!loading && !error && allSubmissions && allSubmissions.length === 0 && (
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

      {!loading && !error && displayedSubmissions && displayedSubmissions.length > 0 && (
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
          
          {!showAllSubmissions && totalPages > 1 && (
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