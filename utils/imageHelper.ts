/**
 * Helper function to construct full image URLs from backend
 * If URL already has protocol, return as-is
 * Otherwise prepend backend base URL
 */
export function getBackendImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '/default-profile.png';
  
  // If already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Get backend URL from environment
  const backendUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.BASE_URL || 
                    'http://127.0.0.1:8000';
  
  // Ensure no double slashes
  const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
  const cleanImagePath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${cleanBackendUrl}${cleanImagePath}`;
}
