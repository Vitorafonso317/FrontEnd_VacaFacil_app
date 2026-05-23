import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setToken,
  setRefreshToken,
  setUnauthorizedHandler,
  setTokensRefreshedHandler,
} from '../services/api';
import type { User } from '../types';

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (token: string, user: User, refreshToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
};

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [token, setTokenState]    = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'refreshToken', 'user']).then(([t, rt, u]) => {
      const savedToken        = t[1]  ?? null;
      const savedRefreshToken = rt[1] ?? null;
      const savedUser         = u[1]  ? JSON.parse(u[1]) : null;

      setToken(savedToken);
      setRefreshToken(savedRefreshToken);
      setTokenState(savedToken);
      setUser(savedUser);
      setLoading(false);

      // Registra handlers depois de injetar token — evita logout no cold start
      setUnauthorizedHandler(signOut);
      setTokensRefreshedHandler((newToken, newRefresh) => {
        setToken(newToken);
        setRefreshToken(newRefresh);
        setTokenState(newToken);
        AsyncStorage.multiSet([['token', newToken], ['refreshToken', newRefresh]]);
      });
    });
  }, []);

  async function signIn(newToken: string, newUser: User, refreshToken?: string) {
    setToken(newToken);
    setRefreshToken(refreshToken ?? null);
    setTokenState(newToken);
    setUser(newUser);
    const pairs: [string, string][] = [
      ['token', newToken],
      ['user', JSON.stringify(newUser)],
    ];
    if (refreshToken) pairs.push(['refreshToken', refreshToken]);
    AsyncStorage.multiSet(pairs);
  }

  async function signOut() {
    setToken(null);
    setRefreshToken(null);
    setTokenState(null);
    setUser(null);
    AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
  }

  function updateUser(partial: Partial<User>) {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      AsyncStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
