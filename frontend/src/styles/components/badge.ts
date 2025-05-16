/**
 * Badge component styles
 * Defines all badge-related styles and variants
 * Based on existing badge styling used in status indicators
 */

import { cn } from '@/lib/utils';
import { statusBadgeVariants } from '../variants';

/**
 * Available badge status types
 */
export type BadgeStatus = keyof typeof statusBadgeVariants | string;

/**
 * Badge variants based on shape
 */
export const badgeShapeVariants = {
  default: 'rounded text-xs font-medium px-2.5 py-0.5',
  rounded: 'rounded-md text-xs font-medium px-2.5 py-0.5',
  pill: 'rounded-full text-xs font-medium px-2.5 py-0.5',
};

/**
 * Map submission status to badge status
 * 
 * @param status - The submission status
 * @returns The corresponding badge status
 */
export function mapSubmissionStatusToBadge(status: string | undefined | null): BadgeStatus {
  const statusMap: Record<string, BadgeStatus> = {
    'approved': 'approved',
    'rejected': 'rejected',
    'selected': 'selected',
    'pending': 'pending',
    'cover': 'special',
  };
  
  // Handle undefined, null, or non-string status defensively
  if (typeof status === 'string') {
    return statusMap[status.toLowerCase()] || 'pending';
  }
  return 'pending'; // Default to 'pending' if status is not a valid string
}

/**
 * Get badge classes for status indicators
 * 
 * @param status - Badge status: approved, rejected, selected, pending
 * @param className - Additional custom classes
 * @param variant - Badge shape variant: default, rounded, pill
 * @returns Combined badge class names
 */
export function getBadgeStyles(
  status: BadgeStatus, 
  className?: string,
  variant: keyof typeof badgeShapeVariants = 'pill'
) {
  // Default to pending if status is not found
  const validStatus = (status in statusBadgeVariants) 
    ? status as keyof typeof statusBadgeVariants
    : 'pending';
    
  return cn(
    'inline-flex items-center',
    badgeShapeVariants[variant],
    statusBadgeVariants[validStatus],
    className
  );
} 