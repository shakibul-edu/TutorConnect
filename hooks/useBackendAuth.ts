import { useSession } from 'next-auth/react';

export function useBackendAuth() {
  const { data: session, status } = useSession();

  return {
    backendAccessToken: session?.backendAccess || null,
    backendRefreshToken: session?.backendRefresh || null,
    idToken: session?.idToken || null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}
