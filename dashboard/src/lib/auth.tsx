'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'user';
  slackDisplayName: string;
  instanceId?: string | null;
}

const dummyAccounts: Record<string, { password: string; user: AuthUser }> = {
  admin: {
    password: 'admin',
    user: { id: 'admin', name: 'Admin', role: 'admin', slackDisplayName: 'admin' },
  },
  user001: {
    password: 'password',
    user: { id: 'user-001', name: 'James Kim', role: 'user', slackDisplayName: 'james.kim', instanceId: 'i-0a1b2c3d4e5f' },
  },
  user002: {
    password: 'password',
    user: { id: 'user-002', name: 'Emma Lee', role: 'user', slackDisplayName: 'emma.lee', instanceId: 'i-1b2c3d4e5f6a' },
  },
  user003: {
    password: 'password',
    user: { id: 'user-003', name: 'Liam Park', role: 'user', slackDisplayName: 'liam.park', instanceId: null },
  },
  user004: {
    password: 'password',
    user: { id: 'user-004', name: 'Olivia Choi', role: 'user', slackDisplayName: 'olivia.choi', instanceId: 'i-3d4e5f6a7b8c' },
  },
};

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => string | null;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => 'Not initialized',
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('openclaw_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = (username: string, password: string): string | null => {
    const account = dummyAccounts[username];
    if (!account || account.password !== password) return 'Invalid credentials';
    setUser(account.user);
    localStorage.setItem('openclaw_user', JSON.stringify(account.user));
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('openclaw_user');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { dummyAccounts };
