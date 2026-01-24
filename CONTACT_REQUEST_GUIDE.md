# Contact Request API Implementation Guide

## Overview
A complete contact request system has been implemented that allows students to send contact requests to teachers. The system includes:
- API request handlers for contact requests
- Complete CRUD operations
- ContactRequestModal component for easy integration
- Type-safe interfaces

## Types Added

### ContactRequest Interface
```typescript
export interface ContactRequest {
  id: number;
  student_name: string;
  student_phone: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  email_opened_at?: string;
  created_at: string;
  updated_at: string;
  student: number;
  teacher: number;
  teacher_phone?: string;  // Available when teacher accepts (status='accepted')
}
```

## API Functions Available

### 1. Submit Contact Request
```typescript
import { submitContactRequest } from '../services/backend';

const response = await submitContactRequest(token, {
  student_name: "Shakibul Islam",
  student_phone: "01994409930",
  message: "I need a tutor",
  teacher: 1
});
```

**Response:**
```json
{
  "id": 1,
  "student_name": "Shakibul Islam",
  "student_phone": "01994409930",
  "message": "I need a tutor",
  "status": "pending",
  "email_opened_at": "2026-01-24T07:52:54Z",
  "created_at": "2026-01-24T07:52:57.561315Z",
  "updated_at": "2026-01-24T07:52:57.561337Z",
  "student": 2,
  "teacher": 1
}
```

### 2. Get All Contact Requests
```typescript
import { getContactRequests } from '../services/backend';

// Get all contact requests with optional filters
const requests = await getContactRequests(token, {
  teacher: 1,  // Optional: filter by teacher
  student: 2,  // Optional: filter by student
  status: 'pending'  // Optional: filter by status
});
```

### 3. Get Single Contact Request
```typescript
import { getContactRequest } from '../services/backend';

const request = await getContactRequest(token, '1');
```

### 4. Update Contact Request
```typescript
import { updateContactRequest } from '../services/backend';

// Update status (e.g., teacher accepts the request)
const response = await updateContactRequest(token, '1', {
  status: 'accepted'  // Now teacher_phone will be available to student
});

// Or update message
const response = await updateContactRequest(token, '1', {
  message: "Updated message"
});
```

### 5. Delete Contact Request
```typescript
import { deleteContactRequest } from '../services/backend';

await deleteContactRequest(token, '1');
```

## Using the ContactRequestModal Component

### Basic Usage
```typescript
import ContactRequestModal from '../components/ContactRequestModal';
import { useState } from 'react';

export default function TutorDetailsPage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsContactModalOpen(true)}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
      >
        Apply for Contact
      </button>

      <ContactRequestModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        teacherId={1}  // Teacher's ID
        teacherName="John Doe"  // Teacher's name
      />
    </>
  );
}
```

## Features

### For Students
- Send contact requests to teachers with their name, phone, and message
- View contact requests they've sent and their status
- See teacher's phone number once teacher accepts the request

### For Teachers
- View all contact requests they've received
- Accept, reject, or mark as pending
- Students can see their contact information only after acceptance

## Integration with Tutor Details Page

To add a "Contact Request" button to the tutor details page, update [id]/page.tsx:

```typescript
import ContactRequestModal from '@/components/ContactRequestModal';
import { useState } from 'react';

const TutorDetailsPage: React.FC<{ params: { id: string } }> = async ({ params }) => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // ... existing code ...

  return (
    <div>
      {/* ... existing tutor details ... */}
      
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setIsContactModalOpen(true)}
          className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Apply for Contact
        </button>
      </div>

      <ContactRequestModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        teacherId={tutor.id}
        teacherName={tutor.user.first_name + ' ' + tutor.user.last_name}
      />
    </div>
  );
};
```

## How It Works

1. **Student Initiates:** Student opens tutor profile and clicks "Apply for Contact"
2. **Modal Opens:** ContactRequestModal opens with pre-filled name field
3. **Student Submits:** Student enters phone and message, clicks "Send Request"
4. **Request Created:** POST request sent to `/contact-request/` endpoint
5. **Status: Pending:** Request is created with status "pending"
6. **Teacher Reviews:** Teacher can view the request and accept/reject it
7. **Student Sees Phone:** Once teacher accepts, student can see `teacher_phone` field

## Status Flow

```
pending → accepted (teacher accepts)
       → rejected (teacher rejects)
```

## Error Handling

The component includes built-in error handling:
- Validates all fields are filled
- Checks user is logged in
- Shows toast notifications for success/error
- Prevents form submission while loading
