# Backend Token Debug Steps

## Issue
Session shows:
- `user_id: missing`
- `is_teacher: undefined`
- `banned: undefined`

This means your backend's **`/auth/google/`** endpoint is **NOT returning** these custom fields.

## Critical: The `/auth/google/` Endpoint

Your frontend calls `POST /auth/google/` with a Google ID token in the Authorization header.
This endpoint MUST:
1. Verify the Google ID token
2. Get or create the user
3. Return JWT tokens WITH custom fields (user_id, is_teacher, banned)

## Test Your Backend

### 1. Check terminal logs
When you log in, look for:
```
🔄 Calling /auth/google/ endpoint: http://127.0.0.1:8000/auth/google/
```

### 2. Test the endpoint manually
```bash
# Get Google ID token from browser (DevTools > Application > Cookies > g_state)
# Or from Network tab when logging in

curl -X POST http://127.0.0.1:8000/auth/google/ \
  -H "Authorization: Bearer YOUR_GOOGLE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -v
```

**Expected Response (MUST include custom fields):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJh...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJh...",
  "user_id": 54,
  "email": "shakibulislamj@gmail.com",
  "is_teacher": true,
  "banned": false
}
```

**Bad Response (missing custom fields - this is your current issue):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJh...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJh..."
}
```

## Django Backend Fix

### Your `urls.py` should have:

```python
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import GoogleAuthView  # Your custom view
from .serializers import CustomTokenRefreshSerializer

urlpatterns = [
    # This endpoint receives Google ID token and returns JWT + custom fields
    path('auth/google/', GoogleAuthView.as_view(), name='google_auth'),
    
    # This endpoint refreshes JWT and returns custom fields
    path('api/token/refresh/', TokenRefreshView.as_view(
        serializer_class=CustomTokenRefreshSerializer
    ), name='token_refresh'),
]
```

### Your `views.py` needs:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class GoogleAuthView(APIView):
    """
    Custom view that accepts Google ID token
    and returns JWT with custom user fields
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        # Extract Google ID token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        google_token = auth_header.replace('Bearer ', '').strip()
        
        if not google_token:
            return Response(
                {'error': 'No token provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify Google token
            idinfo = id_token.verify_oauth2_token(
                google_token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
            
            # Get user info from Google
            email = idinfo.get('email')
            if not email:
                return Response(
                    {'error': 'Email not found in token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': idinfo.get('given_name', ''),
                    'last_name': idinfo.get('family_name', ''),
                }
            )
            
            # Check if banned
            if getattr(user, 'banned', False):
                return Response(
                    {'error': 'This account is banned'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # ⚠️ CRITICAL: Return custom fields
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_id': user.id,
                'email': user.email,
                'is_teacher': getattr(user, 'is_teacher', False),
                'banned': getattr(user, 'banned', False),
            })
            
        except ValueError as e:
            return Response(
                {'error': f'Invalid token: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
```

### Your `serializers.py`:

```python
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    """Returns custom fields when refreshing token"""
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Decode refresh token to get user
        refresh = RefreshToken(attrs['refresh'])
        user_id = refresh['user_id']
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise InvalidToken("User not found")
        
        # Check if banned
        if getattr(user, 'banned', False):
            raise AuthenticationFailed("This account is banned")
        
        # Add custom fields
        data.update({
            'is_teacher': getattr(user, 'is_teacher', False),
            'banned': getattr(user, 'banned', False),
        })
        
        return data
```

### Your `settings.py` needs:

```python
# Google OAuth
GOOGLE_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com'  # From env

# Install required package
# pip install google-auth
```

## After Fixing Backend

1. **Restart Django server**
2. **Check terminal for errors**
3. **In frontend: Sign out completely**
4. **Clear browser cookies** (DevTools > Application > Cookies)
5. **Sign in again**
6. **Check NextAuth logs** in terminal - should see:
   ```
   ✅ Backend tokens retrieved via /api/token/ { access: '...', user_id: 54, is_teacher: true, ... }
   ```
7. **Check debug panel** - should show actual values

## Verify It's Working

Run this in Django shell:
```python
python manage.py shell

from django.contrib.auth import get_user_model
User = get_user_model()

user = User.objects.get(email='shakibulislamj@gmail.com')
print(f"User ID: {user.id}")
print(f"Is Teacher: {user.is_teacher}")
print(f"Banned: {user.banned}")

# Test token generation
from rest_framework_simplejwt.tokens import RefreshToken
refresh = RefreshToken.for_user(user)
print(f"\nAccess Token: {str(refresh.access_token)[:50]}...")
print(f"Refresh Token: {str(refresh)[:50]}...")
```
