'use client';

import { useAuth } from './auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [prefLoading, setPrefLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login with return URL
      const redirectUrl = pathname || '/home';
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [user, loading, router, pathname]);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!supabase) {
        setPrefLoading(false);
        return;
      }
      if (user && pathname !== '/onboarding/routines') {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('is_onboarded_routines')
            .eq('user_id', user.id)
            .single();
            
          if (!error && data) {
            if (data.is_onboarded_routines === false || data.is_onboarded_routines === null) {
              setIsOnboarded(false);
              router.push('/onboarding/routines');
            } else {
              setIsOnboarded(true);
            }
          } else {
            // If error, assume they need onboarding just in case, or ignore if it's missing table
            if (error?.code === '42703') { // Column does not exist
                console.warn('is_onboarded_routines column missing');
                setIsOnboarded(true); // Fail open if migration not run
            } else if (error?.code === 'PGRST116') { // No rows
                setIsOnboarded(false);
                router.push('/onboarding/routines');
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setPrefLoading(false);
        }
      } else {
        setPrefLoading(false);
      }
    };
    
    if (user && !loading) {
      checkOnboarding();
    }
  }, [user, loading, pathname, router]);

  if (loading || (user && prefLoading && pathname !== '/onboarding/routines')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect happens in useEffect
  }
  
  if (!isOnboarded && pathname !== '/onboarding/routines') {
    return null; // Redirecting
  }

  return <>{children}</>;
}