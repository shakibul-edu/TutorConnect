# Authentication Bug Fix Guide

## Problem Summary
**Error:** `[next-auth][error][CLIENT_FETCH_ERROR] Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Root Cause:** The `/api/auth/session` endpoint is returning HTML (error page) instead of JSON response. This typically happens when:
1. `NEXTAUTH_SECRET` environment variable is not set
2. `NEXTAUTH_URL` is not properly configured
3. NextAuth handler is not correctly exporting GET/POST methods

---

## Required Environment Variables

Add these to your `.env.local` file (create if it doesn't exist):

```env
# NextAuth Configuration (CRITICAL)
NEXTAUTH_SECRET=your-super-secret-random-string-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_ID=your-google-client-id-here
GOOGLE_SECRET=your-google-client-secret-here

# Backend Configuration
BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_BASE_URL=http://127.0.0.1:8000
```

### How to Generate `NEXTAUTH_SECRET`

Run this command in your terminal:
```bash
openssl rand -base64 32
```

Or if you don't have openssl, use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Verification Checklist

- [ ] `.env.local` file exists in the project root
- [ ] `NEXTAUTH_SECRET` is set to a random 32+ character string
- [ ] `NEXTAUTH_URL` is set to your development URL (http://localhost:3000)
- [ ] `GOOGLE_ID` and `GOOGLE_SECRET` are valid
- [ ] `BASE_URL` points to your backend server
- [ ] You've restarted the Next.js dev server after changing environment variables

### To restart the dev server:
1. Press `Ctrl+C` in the terminal running `npm run dev`
2. Wait a few seconds
3. Run `npm run dev` again

---

## Testing the Fix

1. **Clear browser cookies:**
   - Open DevTools (F12)
   - Application tab → Cookies → Delete all cookies for localhost:3000

2. **Check the Network tab:**
   - Open DevTools Network tab
   - Try to sign in with Google
   - Look for the `/api/auth/session` request
   - Check if it returns JSON or HTML
   - Status should be 200 with Content-Type: application/json

3. **Check the Console:**
   - Look for any error messages
   - The error should be gone if environment variables are set correctly

---

## Backend Token Exchange Issues

If you see warnings like `⚠️ Backend token exchange failed`, verify:

1. Backend server is running on the configured `BASE_URL`
2. Backend authentication endpoints exist:
   - `POST /auth/google/` - for One Tap authentication
   - `POST /api/token/` - for OAuth token exchange
   - `POST /api/token/refresh/` - for token refresh

3. CORS is properly configured on the backend to accept requests from your frontend

---

## Changes Made to Your Code

### 1. Updated `app/api/auth/[...nextauth]/route.ts`
- Added `NEXTAUTH_URL` configuration support
- Added fallback for `NEXTAUTH_SECRET` (not recommended for production)
- Improved session callback to ensure valid session object
- Better error handling for backend token exchange

### 2. Updated `lib/SessionProvider.tsx`
- Added `refetchInterval` to prevent session expiry
- Added `refetchOnWindowFocus` to catch session changes
- These settings make authentication more robust

---

## Debugging Commands

Check if your environment variables are loaded:
```bash
# In Next.js terminal, you should see these logged
node -e "console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING')"
node -e "console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)"
node -e "console.log('GOOGLE_ID:', process.env.GOOGLE_ID ? 'SET' : 'MISSING')"
```

---

## Production Considerations

Before deploying to production:

1. **Set secure environment variables** on your hosting platform (Vercel, AWS, etc.)
2. **Use a strong random secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **Set `NEXTAUTH_URL` to your production domain:**
   ```
   NEXTAUTH_URL=https://yourdomain.com
   ```
4. **Configure CORS** on backend for your production domain
5. **Remove the fallback secret** from the code (it's only for development debugging)

---

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth Environment Variables](https://next-auth.js.org/configuration/options)
- [CLIENT_FETCH_ERROR](https://next-auth.js.org/errors#client_fetch_error)

---

## Still Having Issues?

1. Check browser console for specific error messages
2. Check server logs for backend token exchange failures
3. Verify network requests in DevTools Network tab
4. Clear `.next` folder and rebuild: `rm -r .next && npm run dev`
