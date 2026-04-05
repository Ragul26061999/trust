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
    // Initial session check
    const checkSession = async () => {
      try {
        if (!isSupabaseConfigured() || !supabase) {
          // Fallback to localStorage ONLY if Supabase is not configured
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          setLoading(false);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Initial session check error:', sessionError);
        } else if (session?.user) {
          const userData = {
            email: session.user.email || '',
            id: session.user.id,
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // No session found, clean up local storage if it was there
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes (crucial for OAuth/Google login)
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state change event:', event);
          
          if (event === 'SIGNED_IN' && session?.user) {
            const userData = {
              email: session.user.email || '',
              id: session.user.id,
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            localStorage.removeItem('user');
          } else if (event === 'INITIAL_SESSION' && session?.user) {
            const userData = {
              email: session.user.email || '',
              id: session.user.id,
            };
            setUser(userData);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured. Using demo mode.');
      // Allow demo credentials if not configured
      if (email.endsWith('@gmail.com') && password === 'password') {
        const userData = { email, id: 'demo-' + Date.now() };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return false;
      }

      if (data.user) {
        const userData = {
          email: data.user.email || '',
          id: data.user.id,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Catch Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
      const userData = { email, id: 'demo-' + Date.now() };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Registration error:', error.message);
        return false;
      }

      return !!data.user;
    } catch (error) {
      console.error('Catch Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured - simulating Google login');
      const userData = { email: 'demo@gmail.com', id: 'demo-' + Date.now() };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      router.push('/dashboard');
      return;
    }
    
    try {
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

  // Improved loading state to prevent layout shifts
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
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