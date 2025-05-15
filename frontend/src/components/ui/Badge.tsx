import React from 'react';
import { getBadgeStyles, BadgeStatus } from '@/styles/components/badge';

export interface BadgeProps {
  status: BadgeStatus;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'rounded' | 'pill';
}

/**
 * Badge component for displaying status indicators
 * Used for submission status, labels, and other indicators
 */
export function Badge({
  status,
  children,
  className,
  variant = 'pill'
}: BadgeProps) {
  return (
    <span className={getBadgeStyles(status, className, variant)}>
      {children}
    </span>
  );
}

/**
 * Predefined badge for submission status
 */
export function StatusBadge({
  status,
  className,
  variant = 'pill'
}: Omit<BadgeProps, 'children'>) {
  // Map status to display text
  const getStatusText = (status: BadgeStatus) => {
    const statusMap: Record<string, string> = {
      'approved': 'Approved',
      'rejected': 'Rejected',
      'selected': 'Selected',
      'pending': 'Pending',
      'cover': 'Cover'
    };
    
    return statusMap[status.toLowerCase()] || status;
  };
  
  return (
    <Badge status={status} className={className} variant={variant}>
      {getStatusText(status)}
    </Badge>
  );
} 