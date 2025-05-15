/**
 * Table component styles
 * Defines all table-related styles and variants
 * Based on existing table styling used in SubmissionTable component
 */

import { cn } from '@/lib/utils';
import { tableVariants } from '../variants';

/**
 * Get table header cell classes
 * 
 * @param className - Additional custom classes
 * @returns Combined table header class names
 */
export function getTableHeaderStyles(className?: string) {
  return cn(tableVariants.header, className);
}

/**
 * Get table cell classes
 * 
 * @param className - Additional custom classes
 * @returns Combined table cell class names
 */
export function getTableCellStyles(className?: string) {
  return cn(tableVariants.cell, className);
}

/**
 * Get table row classes
 * 
 * @param className - Additional custom classes
 * @returns Combined table row class names
 */
export function getTableRowStyles(className?: string) {
  return cn(tableVariants.row, className);
}

/**
 * Complete table styles object for convenient access
 */
export const tableStyles = {
  header: getTableHeaderStyles,
  cell: getTableCellStyles,
  row: getTableRowStyles,
}; 