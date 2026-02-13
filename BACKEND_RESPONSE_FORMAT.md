# Backend Access Token Missing - Debugging Guide

## Problem
Backend is returning a response (status 200) but **not including `access` token** in the response.

---

## What to Check Now

After the code updates, try signing in again and **check the Next.js terminal logs** for one of these:

### ✅ GOOD (Success)
```
🔄 Exchanging Google token with backend: http://127.0.0.1:8000/auth/google/
✅ Backend tokens retrieved from /auth/google/
📊 Backend response keys: [ 'access', 'refresh' ]
✅ Access token present in response
```

### ❌ BAD (Missing access token)
```
🔄 Exchanging Google token with backend: http://127.0.0.1:8000/auth/google/
✅ Backend tokens retrieved from /auth/google/
📊 Backend response keys: [ 'user', 'token' ]  ← Different key names!
❌ Backend did not return access token. Response: {"user": {...}, "token": "..."}
```

---

## Backend Response Format Issue

### Your backend is likely returning:
```json
{
  "user": { ... },
  "token": "some_token_here"
}
```

### But frontend expects:
```json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token"
}
```

---

## How to Fix Backend

### If using Django REST Framework with Simple JWT:

**views.py** - Fix the response format:
```python
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['POST'])
def google_auth(request):
    # Verify Google token...
    google_token = request.META.get('HTTP_AUTHORIZATION', '').replace('Bearer ', '')
    
    # Verify and get user info
    # ...
    
    # Create JWT tokens (CRITICAL!)
    refresh = RefreshToken.for_user(user)
    
    # Return in CORRECT format
    return Response({
        'access': str(refresh.access_token),    # ← MUST be 'access'
        'refresh': str(refresh),                 # ← MUST be 'refresh'
        'user': {                               # ← Optional extra info
            'id': user.id,
            'email': user.email,
            'name': user.get_full_name(),
        }
    })
```

### If using custom authentication:

Make sure you're returning:
```python
{
    'access': 'your_jwt_token_here',
    'refresh': 'your_refresh_token_here'
}
```

---

## Check Backend Response Format

### Method 1: Test with Postman/Curl

```bash
# Get a Google ID token first (from browser console after clicking Google button)
# Then test:

curl -X POST http://127.0.0.1:8000/auth/google/ \
  -H "Authorization: Bearer YOUR_GOOGLE_TOKEN_HERE" \
  -H "Content-Type: application/json"

# Look at the response - what keys does it have?
```

### Method 2: Check Backend Logs

Your Django terminal should show what's being returned.

---

## Frontend Code Changes Needed (If Backend Uses Different Keys)

**Current code expects:**
```typescript
backendData.access    // ← Access token
backendData.refresh   // ← Refresh token
```

**If your backend returns different keys**, update the code:

```typescript
// Example: If backend returns { token, user }
return {
  id: payload.sub,
  email: payload.email,
  name: payload.name,
  image: payload.picture,
  idToken: token,
  backendAccess: backendData.token,      // ← Changed from .access
  backendRefresh: backendData.refresh,
};
```

---

## Two Backend Endpoints to Check

Your frontend calls TWO different endpoints:

### 1. One Tap Authentication
```
POST /auth/google/
```
- Used by: Google One Tap widget
- Sends: `Authorization: Bearer {google_id_token}`
- Should return: `{ "access": "...", "refresh": "..." }`

### 2. Google OAuth Flow
```
POST /api/token/
```
- Used by: Google Sign In button
- Sends: `Authorization: Bearer {google_id_token}`
- Should return: `{ "access": "...", "refresh": "..." }`

**Make sure BOTH endpoints return the same format!**

---

## Quick Checklist

- [ ] Backend returns status 200 for token exchange ✅
- [ ] Response includes `access` key with a JWT token
- [ ] Response includes `refresh` key with a refresh token (or empty string is ok)
- [ ] Both `/auth/google/` and `/api/token/` return same format
- [ ] Tokens are being stored in session

**After fixing backend, restart:**
1. Django: `Ctrl+C` then restart
2. Next.js: `Ctrl+C` then `npm run dev`
3. Clear browser cookies
4. Try signing in again

---

## If Backend is Correct But Still Not Working

Check the actual error response:
```
❌ Backend token exchange failed with status 401: <error_details>
```

Log should show the full error message. Common issues:
- Google token is invalid/expired
- Backend can't verify Google token
- CORS issues (if backend on different domain)
- Missing Google API setup on backend
