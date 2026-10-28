import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mindcare_token');
    if (token) {
      api.get('/auth/me')
        .then(d => setUser(d.user))
        .catch(() => localStorage.removeItem('mindcare_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async (credentialResponse) => {
    const data = await api.post('/auth/google', { token: credentialResponse.credential });
    localStorage.setItem('mindcare_token', data.token);
    setUser(data.user);
  };

  const loginAsDemo = async () => {
    const data = await api.post('/auth/demo');
    localStorage.setItem('mindcare_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('mindcare_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
