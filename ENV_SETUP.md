# Environment Variables Setup

## Quick Setup

1. Create `.env.local` in the project root (same level as `package.json`)
2. Copy and paste the configuration below
3. Generate your own `NEXTAUTH_SECRET` (see instructions)
4. Restart the dev server

---

## `.env.local` Template

```env
# ============================================
# NextAuth Configuration (REQUIRED FOR FIX)
# ============================================
# A random secret for JWT signing and encryption
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET=<GENERATE_AND_PASTE_HERE>

# Your application's URL (for development)
NEXTAUTH_URL=http://localhost:3000

# ============================================
# Google OAuth Configuration (REQUIRED)
# ============================================
# Get these from: https://console.cloud.google.com/
GOOGLE_ID=your-google-client-id-here
GOOGLE_SECRET=your-google-client-secret-here

# ============================================
# Backend Configuration
# ============================================
# URL where your Django/backend server runs
BASE_URL=http://127.0.0.1:8000

# Also expose to browser (frontend-safe)
NEXT_PUBLIC_BASE_URL=http://127.0.0.1:8000
```

---

## Step-by-Step Generation

### Step 1: Generate NEXTAUTH_SECRET

**Option A: Using OpenSSL (Recommended)**
```bash
openssl rand -base64 32
```

**Option B: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as the value for `NEXTAUTH_SECRET`.

### Step 2: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Google+ API"
4. Go to "Credentials" → "Create OAuth 2.0 Client ID"
5. Select "Web application"
6. Add to "Authorized JavaScript origins":
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
7. Add to "Authorized redirect URIs":
   - `http://localhost:3000/api/auth/callback/google`
   - `http://127.0.0.1:3000/api/auth/callback/google`
8. Copy the Client ID and Client Secret

### Step 3: Update .env.local

Replace the placeholders with your actual values:
```env
NEXTAUTH_SECRET=<your-generated-secret-here>
NEXTAUTH_URL=http://localhost:3000
GOOGLE_ID=<your-client-id>
GOOGLE_SECRET=<your-client-secret>
BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_BASE_URL=http://127.0.0.1:8000
```

### Step 4: Restart Dev Server

```bash
# Stop the running server (Ctrl+C)
# Then restart
npm run dev
```

---

## Verification

After setup, verify everything works:

1. **Check variables are loaded:**
   ```bash
   # In your terminal, you should see Next.js loading the env file
   npm run dev
   # Look for: "loaded env from .env.local"
   ```

2. **Test in browser:**
   - Go to http://localhost:3000
   - Try signing in with Google
   - Check DevTools → Network → `/api/auth/session`
   - Should return JSON (not HTML with DOCTYPE)

3. **Check Console:**
   - DevTools → Console → No `CLIENT_FETCH_ERROR` errors
   - Should see user profile loaded successfully

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "NEXTAUTH_SECRET is missing" | Run `openssl rand -base64 32` and add to `.env.local` |
| "Invalid Client ID" | Verify Google credentials and that origins/URIs are correct |
| "CORS Error" | Make sure `BASE_URL` is correct and backend allows frontend domain |
| "Still getting DOCTYPE error" | Clear browser cookies and restart dev server with `Ctrl+C` + `npm run dev` |
| Variables not loading | File must be named `.env.local` (case-sensitive) in project root |

---

## For Production Deployment (Vercel, AWS, etc.)

Instead of `.env.local`, set environment variables in your platform's dashboard:

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add all variables from above
3. Make sure `NEXTAUTH_URL` matches your production domain

**Example for production:**
```env
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_ID=<your-client-id>
GOOGLE_SECRET=<your-client-secret>
BASE_URL=https://your-backend-domain.com
NEXT_PUBLIC_BASE_URL=https://your-backend-domain.com
```

---

**After completing setup, the auth bug should be fixed!** ✅
