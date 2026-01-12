'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    // If user is not authenticated, redirect to login
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show a loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, don't render anything as redirect is happening
  if (user) {
    return null;
  }

  // If user is not authenticated, don't render anything as redirect is happening
  return null;
}
