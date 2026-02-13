# Backend Token Refresh 401 Error - Debugging Guide

## Issue
```
⚠️ Backend refresh failed with status 401
```

**Status:** Session endpoint is working ✅ | Backend token refresh failing ❌

---

## Possible Causes & Solutions

### 1. **Backend Endpoint Mismatch**
Your backend might expect a different endpoint URL.

**Check your backend:**
```python
# Django REST Framework typical endpoint
# POST /api/token/refresh/  OR
# POST /token/refresh/  OR  
# POST /api/auth/token/refresh/
```

**If different, update in code:**
```typescript
// Current:
const refreshRes = await fetch(`${backendUrl}/api/token/refresh/`, {

// Change to match your backend endpoint
const refreshRes = await fetch(`${backendUrl}/token/refresh/`, {
```

---

### 2. **Invalid Refresh Token Format**
The refresh token might be malformed or wrong format.

**To debug:**
1. Open DevTools → Application → Cookies → Find `__Secure-next-auth.jwt`
2. Copy the JWT and decode it at [jwt.io](https://jwt.io)
3. Look for `backendRefresh` field
4. Verify it's a valid JWT token (not null, not empty, has 3 parts separated by dots)

**Check the logs:**
```bash
# In Next.js terminal, you should see:
🔄 Attempting backend token refresh...
✅ Backend token refresh successful
# OR
⚠️ Backend refresh failed with status 401: <error details>
```

---

### 3. **Backend Refresh Endpoint Configuration**
Your Django backend might not accept the refresh token format sent by NextAuth.

**Typical Django DRF implementation:**
```python
# serializers.py
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

# views.py
from rest_framework_simplejwt.views import TokenRefreshView

# urls.py
path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
```

**Expected request format:**
```json
{
  "refresh": "your_refresh_token_here"
}
```

**Expected response format:**
```json
{
  "access": "new_access_token",
  "refresh": "new_refresh_token"  // Optional, depends on backend
}
```

---

### 4. **Missing Backend Authentication Exchange**
If the backend doesn't return a `refresh` token during initial Google login.

**Check your backend endpoint:**
```python
# POST /auth/google/
# This should return both access AND refresh tokens
```

Should return:
```json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token"
}
```

If only returning `access` token, add refresh token:
```python
from rest_framework_simplejwt.tokens import RefreshToken

def google_auth_view(request):
    # ... verify Google token ...
    
    # Create JWT tokens
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh)
    }
```

---

### 5. **CORS or Backend Connectivity**
Backend might reject requests from frontend.

**Verify:**
1. Backend is running: `http://127.0.0.1:8000` ✅
2. CORS is configured to accept requests from `http://localhost:3000`

**Django CORS setup:**
```python
# settings.py
INSTALLED_APPS = [
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

---

## Quick Testing Checklist

- [ ] Backend server is running on `http://127.0.0.1:8000`
- [ ] Refresh endpoint exists and is correctly configured
- [ ] Backend returns both `access` and `refresh` tokens on first login
- [ ] Refresh token is being stored in session JWT
- [ ] Backend accepts the refresh token format from Next.js

---

## Temporary Fix

If you want to disable backend token refresh temporarily:

In `app/api/auth/[...nextauth]/route.ts`, change the JWT callback:

```typescript
async jwt({ token, user, account }) {
  // ... existing code ...
  
  // TEMPORARILY DISABLE REFRESH to debug
  // const shouldRefresh = hasValidRefreshToken && (!token.backendAccess || isBackendTokenExpiring(token.backendAccess));
  // if (shouldRefresh) { ... }
  
  return token;
}
```

This allows login to work while you fix the backend.

---

## Next Steps

1. **Check server logs:** Look at both Next.js and Django terminal output
2. **Verify endpoint:** Test with `curl` or Postman
3. **Test endpoint directly:**

```bash
# Test backend refresh endpoint
curl -X POST http://127.0.0.1:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "your_refresh_token_here"}'
```

4. **Check token in session:**
   - DevTools → Application → Cookies
   - Find `__Secure-next-auth.jwt`
   - Decode at jwt.io to verify `backendRefresh` exists

---

**This is a backend configuration issue, not a Next.js bug. The session endpoint is working correctly now!** ✅
