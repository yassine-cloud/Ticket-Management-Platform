"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthUser = {
  id?: string;
  email?: string;
  username?: string;
  displayName?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const storageKey = 'ticketPlatform.user';

const hasProfileData = (value?: AuthUser | null) =>
  Boolean(value?.username || value?.email || value?.displayName);

const readStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

const writeStoredUser = (value: AuthUser | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!value) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!response.ok) {
        setStatus('unauthenticated');
        setUser(null);
        writeStoredUser(null);
        return;
      }

      const data = (await response.json()) as { user?: AuthUser };
      if (hasProfileData(data.user)) {
        setUser(data.user ?? null);
        writeStoredUser(data.user ?? null);
      } else {
        const storedUser = readStoredUser();
        setUser(storedUser ?? data.user ?? null);
      }
      setStatus('authenticated');
    } catch {
      setStatus('unauthenticated');
      setUser(null);
      writeStoredUser(null);
    }
  }, []);

  useEffect(() => {
    const storedUser = readStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    void refresh();
  }, [refresh]);

  const login = useCallback(async (input: LoginInput) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        setStatus('unauthenticated');
        setUser(null);
        return { ok: false, message: data.message ?? 'Login failed' };
      }

      const data = (await response.json()) as { user?: AuthUser };
      setUser(data.user ?? null);
      writeStoredUser(data.user ?? null);
      setStatus('authenticated');
      return { ok: true };
    } catch {
      setStatus('unauthenticated');
      setUser(null);
      writeStoredUser(null);
      return { ok: false, message: 'Login failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setStatus('unauthenticated');
      setUser(null);
      writeStoredUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout, refresh }),
    [status, user, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
