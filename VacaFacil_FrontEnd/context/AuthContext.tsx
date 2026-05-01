import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken } from '../services/api';
import type { User } from '../types';

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
};

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Lê do disco UMA vez na inicialização e coloca em memória
  useEffect(() => {
    AsyncStorage.multiGet(['token', 'user']).then(([t, u]) => {
      const savedToken = t[1] ?? null;
      const savedUser = u[1] ? JSON.parse(u[1]) : null;
      setToken(savedToken);      // coloca em memória no api.ts
      setTokenState(savedToken);
      setUser(savedUser);
      setLoading(false);
    });
  }, []);

  async function signIn(newToken: string, newUser: User) {
    setToken(newToken);          // memória imediata
    setTokenState(newToken);
    setUser(newUser);
    // persiste em background, sem bloquear a navegação
    AsyncStorage.multiSet([['token', newToken], ['user', JSON.stringify(newUser)]]);
  }

  async function signOut() {
    setToken(null);
    setTokenState(null);
    setUser(null);
    AsyncStorage.multiRemove(['token', 'user']);
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
