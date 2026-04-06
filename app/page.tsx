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

  // If user is authenticated, don't render anything as redirect is happening
  if (user) {
    return null;
  }

  // If user is not authenticated, don't render anything as redirect is happening
  return null;
}
