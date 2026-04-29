import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../api/services';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (companyName: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        try {
          const response = await authApi.getMe();
          if (response.data.success) {
            const latestUser = response.data.data.user;
            setUser(latestUser);
            localStorage.setItem('user', JSON.stringify(latestUser));

            if (latestUser?.company?.code) {
              localStorage.setItem('companyCode', latestUser.company.code);
            }

            if (latestUser?.company?.name) {
              localStorage.setItem('companyName', latestUser.company.name);
            }
          } else {
            logout();
          }
        } catch (error) {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (companyName: string, email: string, password: string) => {
    try {
      const response = await authApi.login(companyName, email, password);
      if (response.data.success) {
        const { accessToken, refreshToken, user: userData } = response.data.data;
        const resolvedCompanyCode = userData?.company?.code || companyName?.trim()?.toUpperCase();
        const resolvedCompanyName = userData?.company?.name || localStorage.getItem('companyName') || companyName?.trim();

        setToken(accessToken);
        setUser(userData);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        if (resolvedCompanyCode) {
          localStorage.setItem('companyCode', resolvedCompanyCode);
        }

        if (resolvedCompanyName) {
          localStorage.setItem('companyName', resolvedCompanyName);
        }

        return { success: true, message: 'Login successful' };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
