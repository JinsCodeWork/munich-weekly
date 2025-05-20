import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { createSubmission } from '@/api/submissions';

interface SubmissionFormProps {
  issueId: number;
  onSuccess?: (submissionId: number) => void;
  onReset?: () => void;
  className?: string;
  redirectPath?: string;
  maxDescriptionLength?: number;
}

/**
 * Submission Form Component
 * Handles description input and submission process
 */
export function SubmissionForm({ 
  issueId, 
  onSuccess,
  onReset,
  className,
  redirectPath = '/account/submissions',
  maxDescriptionLength = 1000
}: SubmissionFormProps) {
  // Form state
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!description.trim()) {
      setError('Please provide a description for your submission.');
      return;
    }
    
    if (description.length > maxDescriptionLength) {
      setError(`Description must be ${maxDescriptionLength} characters or less.`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Only create submission, without imageUrl
      const res = await createSubmission({
        issueId,
        description: description.trim()
      });
      // 成功后回调返回submissionId
      if (onSuccess) {
        onSuccess(res.submissionId);
      }
      
      // Redirect after a delay
      if (redirectPath) {
        setTimeout(() => {
          router.push(redirectPath);
        }, 2000);
      }
      
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit your photo. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className || ''}`}>
      {/* Description field */}
      <div>
        <label 
          htmlFor="description" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Photo Description
        </label>
        <textarea
          id="description"
          rows={4}
          placeholder="Describe your photo, context, or techniques used..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={maxDescriptionLength}
          disabled={isSubmitting}
        />
        
        {/* Character counter */}
        <div className="mt-1 text-xs text-gray-500 flex justify-end">
          {description.length}/{maxDescriptionLength} characters
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}
      
      {/* Form actions */}
      <div className="flex justify-end space-x-3 pt-3">
        {onReset && (
          <Button
            type="button"
            variant="secondary"
            onClick={onReset}
            disabled={isSubmitting}
          >
            Go Back
          </Button>
        )}
        
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : 'Submit Photo'}
        </Button>
      </div>
    </form>
  );
} 