import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/modules';
import type { User } from '../types/api';

type AuthContextValue = {
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<User>;
  logout: () => void;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser() {
  const raw = localStorage.getItem('futsal_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem('futsal_user');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => readStoredUser());

  const setUser = (next: User | null) => {
    setUserState(next);
    if (next) localStorage.setItem('futsal_user', JSON.stringify(next));
    else localStorage.removeItem('futsal_user');
  };

  useEffect(() => {
    const onAuthRequired = () => setUser(null);
    window.addEventListener('authrequired', onAuthRequired);
    return () => window.removeEventListener('authrequired', onAuthRequired);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAdmin: user?.role === 'ADMIN',
    login: async (email, password) => {
      const next = await authApi.login({ email, password });
      setUser(next);
      return next;
    },
    register: async (payload) => authApi.register(payload),
    logout: () => setUser(null),
    setUser
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
