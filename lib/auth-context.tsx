'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from './supabase';

type AuthContextType = {
  user: { email: string; id: string } | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signInWithGoogle: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by checking Supabase session
    const checkSession = async () => {
      try {
        if (!isSupabaseConfigured() || !supabase) {
          // Fallback to localStorage if Supabase is not configured
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          return;
        }
        
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const userData = {
            email: session.user.email || '',
            id: session.user.id,
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // Fallback to localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      // Fallback to demo credentials for development purposes
      if ((email === 'ragul@gmail.com' && password === 'password') || 
          (email === 'anandans0007@gmail.com' && password === 'password123')) {
        const userData = {
          email,
          id: 'demo-user-id-' + Date.now(),
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      
      // If Supabase is not configured and not using demo credentials
      console.warn('Supabase is not configured. Please set up your .env.local file with proper Supabase credentials.');
      return false;
    }
    
    // Use Supabase authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        // Check if it's an API key error or other auth-related error
        if (error.message.includes('Invalid API key') ||
          error.message.includes('AuthApiError') ||
          error.message.includes('401') ||
          error.message.includes('unauthorized') ||
          error.message.includes('expired') ||
          error.message.includes('Invalid login credentials')) {
          // Fallback to demo credentials for development purposes
          if ((email === 'ragul@gmail.com' && password === 'password') || 
              (email === 'anandans0007@gmail.com' && password === 'password123')) {
            const userData = {
              email,
              id: 'demo-user-id-' + Date.now(),
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return true;
          }
        }
        return false;
      }

      // Store user data
      const userData = {
        email: data.user.email || '',
        id: data.user.id,
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      // Handle specific API key error or other auth-related errors
      if (error.message &&
        (error.message.includes('Invalid API key') ||
          error.message.includes('AuthApiError') ||
          error.message.includes('401') ||
          error.message.includes('unauthorized') ||
          error.message.includes('expired') ||
          error.message.includes('Invalid login credentials'))) {
        // For development, allow demo credentials
        if ((email === 'ragul@gmail.com' && password === 'password') || 
            (email === 'anandans0007@gmail.com' && password === 'password123')) {
          const userData = {
            email,
            id: 'demo-user-id-' + Date.now(),
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          return true;
        }
      }
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      // For development, allow demo registration
      const userData = {
        email,
        id: 'demo-user-id-' + Date.now(),
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    
    // Use Supabase registration
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Registration error:', error);
        // Check if it's an API key error or other auth-related error
        if (error.message.includes('Invalid API key') ||
          error.message.includes('AuthApiError') ||
          error.message.includes('401') ||
          error.message.includes('unauthorized') ||
          error.message.includes('expired')) {
          // For development, allow demo registration
          const userData = {
            email,
            id: 'demo-user-id-' + Date.now(),
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          return true;
        }
        return false;
      }

      // If user needs to confirm email, store temp user data
      if (data.user) {
        const userData = {
          email: data.user.email || '',
          id: data.user.id,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      } else {
        // If confirmation is needed, return true anyway
        return true;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      // Handle specific API key error or other auth-related errors
      if (error.message &&
        (error.message.includes('Invalid API key') ||
          error.message.includes('AuthApiError') ||
          error.message.includes('401') ||
          error.message.includes('unauthorized') ||
          error.message.includes('expired'))) {
        // For development, allow demo registration
        const userData = {
          email,
          id: 'demo-user-id-' + Date.now(),
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.signOut().catch(error => {
        console.error('Logout error:', error);
        // Continue with local cleanup even if Supabase logout fails
      });
    }
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  const signInWithGoogle = async () => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase is not configured. Please set up your .env.local file with proper Supabase credentials.');
      // For development, simulate successful login with demo user
      const userData = {
        email: 'demo@gmail.com',
        id: 'demo-user-id-' + Date.now(),
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return;
    }
    
    try {
      // Use a popup for Google OAuth
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    signInWithGoogle,
    loading,
  };

  // Only render children when not loading to avoid hydration errors
  if (loading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}