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
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              localStorage.removeItem('user');
            }
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
    const trimmedEmail = email.trim();
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured. Using demo mode.');
      // Allow demo credentials if not configured
      if (trimmedEmail.endsWith('@gmail.com') && password === 'password') {
        const userData = { email: trimmedEmail, id: 'demo-' + Date.now() };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      throw new Error('Invalid login credentials');
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        throw new Error(error.message);
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
    } catch (error: any) {
      console.error('Catch Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail.toLowerCase().endsWith('@gmail.com')) {
      throw new Error('Only Gmail accounts are permitted for registration.');
    }

    if (!isSupabaseConfigured() || !supabase) {
      const userData = { email: trimmedEmail, id: 'demo-' + Date.now() };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Supabase returns a user with empty identities if the email is already taken
      // (when email enumeration protection is turned on)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('This email is already registered. Please sign in instead.');
      }

      return !!data.user;
    } catch (error: any) {
      console.error('Catch Registration error:', error);
      throw error;
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}