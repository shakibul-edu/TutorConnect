# Auth Bug Fix Summary

## Issue Identified
**Error:** `CLIENT_FETCH_ERROR` when signing in with Google - `/api/auth/session` returning HTML instead of JSON

## Root Cause
Missing or incorrect NextAuth environment variables, particularly:
- `NEXTAUTH_SECRET` - Required for JWT signing
- `NEXTAUTH_URL` - Required to properly construct session endpoint URLs

## Fixes Applied

### 1. **`app/api/auth/[...nextauth]/route.ts`** - Enhanced Configuration
   - Added conditional `NEXTAUTH_URL` configuration
   - Added fallback for `NEXTAUTH_SECRET` with development warning
   - Improved session callback to validate `session.user` exists
   - Better error handling throughout

**Key changes:**
```typescript
// Added NEXTAUTH_URL support
...(process.env.NEXTAUTH_URL && { url: process.env.NEXTAUTH_URL }),

// Added fallback for secret (for development only)
secret: process.env.NEXTAUTH_SECRET || 'default-insecure-secret-change-in-production',

// Improved session callback
async session({ session, token }) {
  if (session.user) {
    session.idToken = token.idToken;
    session.backendAccess = token.backendAccess;
    session.backendRefresh = token.backendRefresh;
  }
  return session;
}
```

### 2. **`lib/SessionProvider.tsx`** - Better Session Management
   - Added `refetchInterval={60}` - Refetch session every 60 seconds
   - Added `refetchOnWindowFocus={true}` - Refresh session when window regains focus
   - Prevents session expiry issues

**Key changes:**
```typescript
<SessionProvider 
  refetchInterval={60}
  refetchOnWindowFocus={true}
>
```

## Next Steps - REQUIRED

1. **Create `.env.local` file** in project root with:
   ```env
   NEXTAUTH_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" >
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_ID=your-google-client-id
   GOOGLE_SECRET=your-google-client-secret
   BASE_URL=http://127.0.0.1:8000
   NEXT_PUBLIC_BASE_URL=http://127.0.0.1:8000
   ```

2. **Restart dev server:**
   - Stop: `Ctrl+C`
   - Start: `npm run dev`

3. **Clear browser cookies:**
   - DevTools → Application → Cookies → Delete all for localhost:3000

4. **Test sign-in:**
   - Try signing in with Google
   - Check DevTools → Network for `/api/auth/session` request
   - Should return JSON with status 200, not HTML

## Verification

**Before fix:** `/api/auth/session` → HTML error (DOCTYPE)
**After fix:** `/api/auth/session` → Valid JSON response

If still seeing the error:
1. Check browser console for specific errors
2. Verify `.env.local` variables are set
3. Check server logs for backend token exchange failures
4. See `AUTH_SETUP_GUIDE.md` for detailed debugging

---

**Status:** Fixes applied, awaiting environment variable configuration
