# Onboarding Comments System Guide

## Overview
The onboarding comments system allows users to provide feedback and ask questions during the onboarding tour. Comments are stored in Supabase and can be viewed by administrators.

## Features

### 1. Comment Submission (User Side)
- **Location**: OnboardingOverlay component (right side panel during onboarding)
- **Functionality**: 
  - Users can type comments or questions in a textarea
  - Each comment is automatically tagged with:
    - Current page/view
    - Current step number
    - Timestamp
  - Real-time feedback (success/error messages)
  - Comments are sent to the server and stored in the database

### 2. Comment Management (Admin Side)
- **Location**: Accessible via sidebar under "Management" → "Onboarding Feedback"
- **Functionality**:
  - View all submitted comments
  - Filter by page/step
  - See timestamp for each comment
  - Refresh to load new comments

## Technical Implementation

### Backend (Supabase)
- **Server**: `/supabase/functions/server/index.tsx`
- **Endpoints**:
  - `POST /make-server-7771b72b/comments` - Submit new comment
  - `GET /make-server-7771b72b/comments/:page` - Get comments for specific page
  - `GET /make-server-7771b72b/comments` - Get all comments (admin view)

### Storage
Comments are stored in the Supabase key-value store with the following structure:
```typescript
{
  page: string;           // Current view (e.g., "dashboard", "quotas")
  comment: string;        // User's comment text
  timestamp: string;      // ISO timestamp
  stepId: number | null;  // Onboarding step number
}
```

### Frontend Components
1. **OnboardingOverlay** (`/components/OnboardingOverlay.tsx`)
   - Displays comment input field
   - Handles comment submission
   - Shows success/error feedback

2. **OnboardingCommentsView** (`/components/OnboardingCommentsView.tsx`)
   - Admin interface for viewing all comments
   - Displays comments with metadata (page, step, timestamp)
   - Refresh functionality

## How to Use

### For Users:
1. Start the onboarding tour (wizard hat button)
2. At any step, scroll down in the right panel
3. Type your feedback or question in the comment field
4. Click "Send" button
5. Wait for confirmation message

### For Administrators:
1. Click on the sidebar menu
2. Navigate to "Management" → "Onboarding Feedback"
3. View all submitted comments
4. Use the refresh button to load new comments

## API Examples

### Submit a Comment
```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-7771b72b/comments`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({
      page: 'dashboard',
      comment: 'This is a great feature!',
      timestamp: new Date().toISOString(),
      stepId: 2,
    }),
  }
);
```

### Get All Comments
```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-7771b72b/comments`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  }
);
```

## Security Notes
- All API calls use Bearer token authentication
- Database credentials are kept server-side only
- Comments are stored with page context for better organization
- No sensitive user data is stored (currently anonymous)

## Future Enhancements
- Add user identification (associate comments with logged-in users)
- Implement comment moderation/approval workflow
- Add email notifications for new comments
- Export comments to CSV/Excel
- Add search and filtering capabilities
- Implement comment replies/responses

## Troubleshooting

### Comments not sending
1. Check browser console for errors
2. Verify Supabase connection is active
3. Ensure environment variables are set correctly

### Comments not displaying
1. Click the refresh button
2. Check server logs for errors
3. Verify the key-value store is accessible

### Access denied errors
1. Verify Bearer token is correctly set
2. Check CORS settings in server configuration
3. Ensure Supabase project ID is correct
