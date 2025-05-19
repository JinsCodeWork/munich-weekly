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
import { Thumbnail } from "@/components/ui/Thumbnail"

export default function SubmissionsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<MySubmissionResponse[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<number | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 16 // 固定每页显示16个提交

  // Load submissions data
  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log("Loading user submissions, page:", currentPage, "filter:", selectedIssue);
      
      // 注意：API中的页码是从0开始的，但UI中是从1开始的
      const response = await submissionsApi.getUserSubmissions(
        selectedIssue, 
        currentPage - 1, 
        pageSize
      )
      
      if (Array.isArray(response)) {
        // 兼容处理：如果返回的是数组（API尚未支持分页）
        setSubmissions(response)
        setTotalPages(Math.ceil(response.length / pageSize))
      } else {
        // 处理分页响应
        setSubmissions(response.content)
        setTotalPages(response.totalPages)
      }
      
      console.log("Successfully loaded user submissions:", response)
      
      // 检查图片URL
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

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 可以选择滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle issue filter change
  const handleIssueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedIssue(value === "all" ? undefined : parseInt(value))
    setCurrentPage(1) // 切换筛选条件时，重置到第一页
  }

  // 渲染提交卡片
  const renderSubmissionCard = (submission: MySubmissionResponse) => {
    // 检查图片URL
    console.log(`Rendering submission ${submission.id}:`, {
      imageUrl: submission.imageUrl,
      processedUrl: getImageUrl(submission.imageUrl)
    });
    
    const issue = issues.find(issue => 
      // 尝试从图片URL中提取期刊ID，如果无法提取则使用第一个期刊作为默认值
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
          issue: issue,
          userId: user?.id || 0
        }}
      />
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-200 pb-5 mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
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
            <h3 className="font-medium mb-2">Image Display Diagnostics (First Submission):</h3>
            {submissions[0] && (
              <div className="space-y-4">
                <div>
                  <p><strong>ID:</strong> {submissions[0].id}</p>
                  <p><strong>Status:</strong> {submissions[0].status}</p>
                  <p><strong>Original Image URL:</strong> {submissions[0].imageUrl}</p>
                  <p><strong>Processed URL:</strong> {getImageUrl(submissions[0].imageUrl)}</p>
                </div>
                
                <div>
                  <p className="font-medium mt-4">Using Original URL:</p>
                  <div className="max-h-40 mt-2 relative bg-gray-200 rounded">
                    <Thumbnail 
                      src={submissions[0].imageUrl} 
                      alt="Original URL" 
                      className="max-w-xs object-contain h-32"
                      width={320}
                      height={128}
                      objectFit="contain"
                      rounded={false}
                      unoptimized
                      showErrorMessage
                    />
                  </div>
                </div>
                
                <div>
                  <p className="font-medium mt-4">Using Processed URL:</p>
                  <div className="max-h-40 mt-2 relative bg-gray-200 rounded">
                    <Thumbnail 
                      src={getImageUrl(submissions[0].imageUrl)} 
                      alt="Processed URL" 
                      className="max-w-xs object-contain h-32"
                      width={320}
                      height={128}
                      objectFit="contain"
                      rounded={false}
                      unoptimized
                      showErrorMessage
                    />
                  </div>
                </div>
                
                <div>
                  <p className="font-medium mt-4">Via Next.js Thumbnail Component:</p>
                  <div className="max-h-40 mt-2">
                    <Thumbnail 
                      src={getImageUrl(submissions[0].imageUrl)} 
                      alt="Next.js Thumbnail" 
                      className="border border-gray-300"
                      width={320}
                      height={180}
                      objectFit="contain"
                      showErrorMessage
                    />
                  </div>
                </div>
                
                <div>
                  <p className="font-medium mt-4">Via Next.js Proxy Auto-constructed URL:</p>
                  <div className="max-h-40 mt-2 relative bg-gray-200 rounded">
                    <Thumbnail 
                      src={`/uploads/${submissions[0].imageUrl.split('/').pop()}`} 
                      alt="Via Proxy" 
                      className="max-w-xs object-contain h-32"
                      width={320}
                      height={128}
                      objectFit="contain"
                      rounded={false}
                      unoptimized
                      showErrorMessage
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {submissions.map((submission) => {
              // 调试信息
              console.log(`Submission ${submission.id} image URL:`, submission.imageUrl);
              console.log(`Submission ${submission.id} processed URL:`, getImageUrl(submission.imageUrl));
              
              return renderSubmissionCard(submission);
            })}
          </div>
          
          {/* 添加分页组件 */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              showFirstLastButtons
              showPageSelector
              maxVisiblePages={5}
              simplifyOnMobile
            />
          )}
        </>
      )}
    </div>
  )
} 