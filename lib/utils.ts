import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind classes safely.
 * Solves specificity issues and conditional class rendering.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
