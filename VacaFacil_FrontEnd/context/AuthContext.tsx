import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'user']).then(([t, u]) => {
      if (t[1]) setToken(t[1]);
      if (u[1]) setUser(JSON.parse(u[1]));
      setLoading(false);
    });
  }, []);

  async function signIn(token: string, user: User) {
    await AsyncStorage.multiSet([['token', token], ['user', JSON.stringify(user)]]);
    setToken(token);
    setUser(user);
  }

  async function signOut() {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
