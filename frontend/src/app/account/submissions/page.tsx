"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { getUserSubmissions, getIssues } from "@/lib/api"
import { Issue, MySubmissionResponse, Submission, SubmissionStatus } from "@/types/submission"
import { SubmissionCard } from "@/components/submission/SubmissionCard"

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
      const response = await getUserSubmissions(selectedIssue)
      setSubmissions(response || [])
      console.log("Loaded submissions:", response)
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
      const issuesData = await getIssues()
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
      <div className="flex justify-between items-center border-b border-gray-200 pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
          <p className="mt-2 text-sm text-gray-500">
            View and manage all your submitted photos
          </p>
        </div>
        
        {/* Issue filter */}
        <div className="flex items-center">
          <label htmlFor="issue-filter" className="mr-2 text-sm text-gray-500">
            Filter by Issue:
          </label>
          <select
            id="issue-filter"
            className="border border-gray-300 rounded-md py-1.5 px-3 text-sm"
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
            You don't have any submissions yet
          </h3>
          <p className="text-gray-500 mb-4">
            Upload your photos to participate in Munich Weekly
          </p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Upload Photo
          </button>
        </div>
      )}

      {/* Submissions list */}
      {!loading && !error && submissions && submissions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {submissions.map((submission) => (
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
                issue: issues.find(issue => submission.imageUrl.includes(`issue${issue.id}`)) || {
                  id: 1,
                  title: "Unknown Issue",
                  description: "",
                  submissionStart: "",
                  submissionEnd: "",
                  votingStart: "",
                  votingEnd: "",
                  createdAt: ""
                },
                userId: user?.id || 0
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
} 