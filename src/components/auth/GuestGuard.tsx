import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { LoadingScreen } from '@/components/common/LoadingScreen';
import { safeRedirect } from '@/lib/redirect';
import { useAuthStore } from '@/stores/authStore';

export function GuestGuard() {
  const status = useAuthStore((state) => state.status);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const location = useLocation();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (status === 'idle') {
    return <LoadingScreen />;
  }

  if (status === 'authenticated') {
    const redirect = safeRedirect(new URLSearchParams(location.search).get('redirect'));
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}
