import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  loginMethod: 'email' | 'google';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  googleLogin: (credential: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = (email: string, password: string) => {
    // For now, create a mock token and user
    // Later connect to your FastAPI backend
    const mockToken = `token_${Date.now()}`;
    const mockUser: User = {
      id: '1',
      name: email.split('@')[0],
      email: email,
      loginMethod: 'email',
    };

    setToken(mockToken);
    setUser(mockUser);
    navigate('/dashboard');
  };

  const signup = (name: string, email: string, password: string) => {
    // For now, create a mock token and user
    // Later connect to your FastAPI backend
    const mockToken = `token_${Date.now()}`;
    const mockUser: User = {
      id: '1',
      name: name,
      email: email,
      loginMethod: 'email',
    };

    setToken(mockToken);
    setUser(mockUser);
    navigate('/dashboard');
  };

  const googleLogin = (credential: string) => {
    try {
      // Decode the JWT credential from Google
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const userInfo = JSON.parse(jsonPayload);

      const mockToken = `token_${Date.now()}`;
      const mockUser: User = {
        id: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture,
        loginMethod: 'google',
      };

      setToken(mockToken);
      setUser(mockUser);
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error('Failed to login with Google');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    navigate('/auth/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        googleLogin,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}