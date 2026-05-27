"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from './AuthProvider';

const publicRoutes = new Set(['/auth/login', '/auth/register']);

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated' && !publicRoutes.has(pathname)) {
      router.replace('/auth/login');
    }
    if (status === 'authenticated' && publicRoutes.has(pathname)) {
      router.replace('/dashboard');
    }
  }, [status, pathname, router]);

  if (publicRoutes.has(pathname)) {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Checking session...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
};

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="auth-wrapper min-h-screen bg-gray-50 flex flex-col">
      <AuthProvider>
        <AuthGate>{children}</AuthGate>
      </AuthProvider>
    </div>
  );
};
