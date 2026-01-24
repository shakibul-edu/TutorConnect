# Error Handling Implementation Guide

## Overview
A centralized error handling system has been implemented across the entire application. All API errors from the backend are automatically parsed and formatted for display to users via toast notifications.

## Supported Error Formats

### 1. Simple Detail Error
Backend response:
```json
{
  "detail": "You cannot have more than 2 pending contact requests."
}
```

User sees: `"You cannot have more than 2 pending contact requests."`

### 2. Field-based Validation Errors
Backend response:
```json
{
  "student_name": ["This field is required."],
  "teacher": ["This field is required."],
  "fee_budget": ["Ensure this value is greater than or equal to 1."]
}
```

User sees:
```
Student name: This field is required.
Teacher: This field is required.
Fee budget: Ensure this value is greater than or equal to 1.
```

## How It Works

### FetchApi.parseErrorResponse()
Located in: [FetchApi.ts](FetchApi.ts)

This private static method automatically:
1. Detects the error format from the backend
2. Extracts and formats error messages
3. Capitalizes and formats field names (e.g., `student_name` → `Student name`)
4. Combines multiple errors with newlines for better readability
5. Provides fallback messages for unexpected formats

### Error Flow
```
Backend Error → FetchApi.request() → parseErrorResponse() → throw Error(message) → Component catch → toast.error()
```

## Usage Pattern

### Standard Pattern (Recommended)
```typescript
try {
  await someApiCall(token, data);
  toast.success('Operation successful!');
} catch (error) {
  console.error('Error context:', error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  toast.error(errorMessage);
}
```

### Why This Pattern?
- Error is already parsed by `FetchApi.parseErrorResponse()`
- No need to manually parse error response
- Consistent error display across the app
- Automatic field name formatting
- Multi-line support for multiple validation errors

## Examples

### Contact Request Submission
**File:** [components/ContactRequestModal.tsx](components/ContactRequestModal.tsx)

```typescript
try {
  const response = await submitContactRequest(token, {
    student_name: formData.student_name,
    student_phone: formData.student_phone,
    fee_budget: budgetNumber,
    message: formData.message,
    teacher: Number(teacherId),
  });
  
  if (response) {
    toast.success('Contact request sent successfully!');
    onClose();
  }
} catch (error) {
  console.error('Error submitting contact request:', error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  toast.error(errorMessage);
}
```

**Possible Errors:**
- "You cannot have more than 2 pending contact requests." (detail error)
- "Student name: This field is required." (field error)
- "Fee budget: Ensure this value is greater than or equal to 1." (field error)

### Profile Update
**File:** [components/TeacherProfileForm.tsx](components/TeacherProfileForm.tsx)

```typescript
try {
  if (profileId) {
    await updateTeacher(token, String(profileId), profileData);
    toast.success('Profile updated successfully!');
  }
  push('dashboard');
} catch (error) {
  console.error('Profile submission error:', error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  toast.error(errorMessage);
}
```

### Contact Request Status Update
**File:** [app/dashboard/page.tsx](app/dashboard/page.tsx)

```typescript
try {
  await updateContactRequest(token, String(id), { status });
  toast.success(`Request ${status}.`);
  triggerRefresh();
} catch (error) {
  console.error('Error updating contact request', error);
  const errorMessage = error instanceof Error ? error.message : 'Failed to update request';
  toast.error(errorMessage);
}
```

## Utility Functions

For advanced error handling needs, use the utilities in [utils/errorHandler.ts](utils/errorHandler.ts):

```typescript
import { extractErrorMessage, isNetworkError, isAuthError } from '../utils/errorHandler';

try {
  await apiCall();
} catch (error) {
  if (isNetworkError(error)) {
    toast.error('Network connection issue. Please check your internet.');
  } else if (isAuthError(error)) {
    // Handle authentication error
    router.push('/login');
  } else {
    toast.error(extractErrorMessage(error));
  }
}
```

## Field Name Formatting Rules

Field names are automatically formatted:
- `student_name` → `Student name`
- `fee_budget` → `Fee budget`
- `teacher_phone` → `Teacher phone`
- `created_at` → `Created at`

**Logic:**
1. Split by underscore
2. Capitalize first word
3. Lowercase remaining words
4. Join with spaces

## Toast Display

Errors are displayed using the toast system ([lib/toast.tsx](lib/toast.tsx)):

```typescript
toast.error(errorMessage);  // Red toast with error message
toast.success(message);     // Green toast with success message
toast.warning(message);     // Yellow toast with warning
```

Multi-line errors automatically wrap and display properly in the toast.

## Testing Error Handling

### Test Case 1: Detail Error
Send more than 2 pending contact requests:
```
Expected: "You cannot have more than 2 pending contact requests."
```

### Test Case 2: Required Field
Submit contact request without student name:
```
Expected: "Student name: This field is required."
```

### Test Case 3: Multiple Field Errors
Submit contact request with missing name and teacher:
```
Expected:
"Student name: This field is required.
Teacher: This field is required."
```

### Test Case 4: Validation Error
Submit fee budget of 0:
```
Expected: "Fee budget: Ensure this value is greater than or equal to 1."
```

## Best Practices

1. **Always use try-catch** for async operations
2. **Log errors** with console.error for debugging
3. **Extract message** from Error object before displaying
4. **Provide fallback** messages for unknown errors
5. **Keep success messages simple** and action-oriented
6. **Let FetchApi handle parsing** - don't manually parse error responses

## Migration Guide

### Old Pattern ❌
```typescript
catch (error) {
  toast.error(`Failed to send request: ${error}`);
}
```

### New Pattern ✅
```typescript
catch (error) {
  console.error('Error context:', error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  toast.error(errorMessage);
}
```

## Files Modified

- [FetchApi.ts](FetchApi.ts) - Core error parsing logic
- [components/ContactRequestModal.tsx](components/ContactRequestModal.tsx) - Contact request submission
- [components/TeacherProfileForm.tsx](components/TeacherProfileForm.tsx) - Profile updates
- [app/dashboard/page.tsx](app/dashboard/page.tsx) - Contact request status changes
- [utils/errorHandler.ts](utils/errorHandler.ts) - Helper utilities

## Additional Notes

- The system works with all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- 401 errors still trigger re-authentication flow
- Network errors show generic "Failed to fetch" message
- Empty error responses show HTTP status text or code
