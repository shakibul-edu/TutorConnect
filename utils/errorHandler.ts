/**
 * Error Handler Utilities
 * 
 * This file documents the centralized error handling approach used in the application.
 * All API errors are automatically parsed by FetchApi.parseErrorResponse() method.
 * 
 * Supported Error Formats from Backend:
 * 
 * 1. Simple Detail Error:
 *    { "detail": "You cannot have more than 2 pending contact requests." }
 *    
 * 2. Field-based Validation Errors:
 *    {
 *      "student_name": ["This field is required."],
 *      "teacher": ["This field is required."],
 *      "fee_budget": ["Ensure this value is greater than or equal to 1."]
 *    }
 * 
 * Usage Pattern:
 * 
 * try {
 *   await someApiCall();
 *   toast.success('Success message');
 * } catch (error) {
 *   console.error('Error context:', error);
 *   const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
 *   toast.error(errorMessage);
 * }
 * 
 * The FetchApi class automatically:
 * - Parses both error formats
 * - Formats field names (student_name → Student name)
 * - Combines multiple field errors with newlines
 * - Provides fallback messages for unexpected formats
 */

/**
 * Extract error message from caught error
 * Use this helper when you need to extract the message for custom handling
 */
export function extractErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && 
    (error.message === 'Failed to fetch' || error.message.includes('Network'));
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof Error && 
    (error.message.includes('401') || error.message.includes('Unauthorized'));
}
