import React from "react";
import { LoadingState, ErrorState } from "@/components/ui/LoadingErrorStates";

export interface ManageSubmissionsStatusSectionProps {
  loading: boolean;
  error: string | null;
  hasSubmissions: boolean;
  onRetry: () => void;
  onUseMockData: () => void;
  showMockDataOption: boolean;
}

export function ManageSubmissionsStatusSection({
  loading,
  error,
  hasSubmissions,
  onRetry,
  onUseMockData,
  showMockDataOption,
}: ManageSubmissionsStatusSectionProps) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={onRetry}
        onUseMockData={onUseMockData}
        showMockDataOption={showMockDataOption}
      />
    );
  }

  if (!hasSubmissions) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No submissions found for this issue</p>
      </div>
    );
  }

  return null;
}
