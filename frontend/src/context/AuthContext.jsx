import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AuthContext } from './contexts';
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  useEffect(() => {
    let live = true;
    api('/auth/profile')
      .then((data) => {
        if (live) setUser(data.user);
      })
      .catch((error) => {
        if (live && error.status !== 401) setError(error);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    const end = () => setUser(null);
    window.addEventListener('acadhub:session-ended', end);
    return () => {
      live = false;
      window.removeEventListener('acadhub:session-ended', end);
    };
  }, []);
  async function login(input) {
    const data = await api('/auth/login', { method: 'POST', body: input });
    setUser(data.user);
    setError(null);
    return data.user;
  }
  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  }
  async function refresh() {
    const data = await api('/auth/profile');
    setUser(data.user);
    return data.user;
  }
  return (
    <AuthContext.Provider value={{ user, setUser, loading, error, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
