"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { issuesApi, submissionsApi } from "@/api"
import { Issue, MySubmissionResponse, SubmissionStatus } from "@/types/submission"
import { SubmissionCard } from "@/components/submission/SubmissionCard"
import { getImageUrl } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

export default function SubmissionsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<MySubmissionResponse[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<number | undefined>(undefined)

  // Load submissions data
  const loadSubmissions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await submissionsApi.getUserSubmissions(selectedIssue)
      setSubmissions(response || [])
      console.log("Loaded submissions:", response)
      if (response && response.length > 0) {
        console.log("First submission image URL:", response[0].imageUrl)
      }
    } catch (err) {
      console.error("Failed to load submissions:", err)
      setError("Failed to load submissions, please try again later")
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }

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

  // Reload submissions when selected issue changes
  useEffect(() => {
    if (user) {
      loadSubmissions()
    }
  }, [selectedIssue, user])

  // Initial load of issues data
  useEffect(() => {
    loadIssues()
  }, [])

  // Handle issue filter change
  const handleIssueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedIssue(value === "all" ? undefined : parseInt(value))
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-200 pb-5 mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
          <p className="mt-2 text-sm text-gray-500">
            View and manage all your submitted photos
          </p>
        </div>
        
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
            <i className="fa-solid fa-circle-exclamation text-4xl"></i>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">
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
            <i className="fa-solid fa-image text-4xl"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
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

      {/* Submissions list */}
      {!loading && !error && submissions && submissions.length > 0 && (
        <>
          {/* 调试信息 */}
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-medium mb-2">Debug Info (First Submission):</h3>
            {submissions[0] && (
              <div>
                <p><strong>Image URL:</strong> {submissions[0].imageUrl}</p>
                <p><strong>Processed URL:</strong> {getImageUrl(submissions[0].imageUrl)}</p>
                <p><strong>Direct Image Test:</strong></p>
                <img 
                  src={getImageUrl(submissions[0].imageUrl)} 
                  alt="Debug" 
                  className="max-h-40 border border-gray-300 mt-2" 
                />
                <p className="mt-4"><strong>通过Next.js代理检查:</strong></p>
                <img 
                  src={`/uploads/${submissions[0].imageUrl.split('/').pop()}`} 
                  alt="Debug via Next.js proxy" 
                  className="max-h-40 border border-gray-300 mt-2" 
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {submissions.map((submission) => {
              // 调试信息
              console.log(`Submission ${submission.id} image URL:`, submission.imageUrl);
              console.log(`Submission ${submission.id} processed URL:`, getImageUrl(submission.imageUrl));
              
              return (
                <SubmissionCard
                  key={submission.id}
                  submission={{
                    id: submission.id,
                    imageUrl: submission.imageUrl,
                    description: submission.description,
                    status: submission.status as SubmissionStatus,
                    submittedAt: submission.submittedAt,
                    voteCount: submission.voteCount,
                    isCover: submission.isCover,
                    issue: issues.find(issue => 
                      // Try to find the matching issue from the image URL pattern or use the first issue as fallback
                      submission.imageUrl.includes(`issue${issue.id}`)
                    ) || (issues.length > 0 ? issues[0] : {
                      id: 1,
                      title: "Unknown Issue",
                      description: "",
                      submissionStart: "",
                      submissionEnd: "",
                      votingStart: "",
                      votingEnd: "",
                      createdAt: ""
                    }),
                    userId: user?.id || 0
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  )
} 