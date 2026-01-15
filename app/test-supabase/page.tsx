'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase'; // Using your existing supabase client

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('Checking connection...');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setStatus('❌ Environment variables not configured');
          return;
        }

        // Test the connection by fetching the current user (might be null if not logged in)
        if (!supabase) {
          setStatus('❌ Supabase client not initialized');
          return;
        }
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus(`❌ Session error: ${sessionError.message}`);
          return;
        }

        setUser(session?.user || null);
        setStatus('✅ Successfully connected to Supabase!');
      } catch (err: any) {
        console.error('Connection error:', err);
        setError(err.message);
        setStatus(`❌ Connection failed: ${err.message}`);
      }
    };

    checkConnection();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) {
      setError('Supabase client not initialized');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      console.error('Sign in error:', error);
      setError(error.message);
    }
  };

  const signOut = async () => {
    if (!supabase) {
      setError('Supabase client not initialized');
      return;
    }
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      setError(error.message);
    } else {
      setUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Supabase Connection Test</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold mb-2">Connection Status:</h2>
          <p>{status}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-red-700">
            <h2 className="font-semibold mb-2">Error:</h2>
            <p>{error}</p>
          </div>
        )}

        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h2 className="font-semibold mb-2">Current User:</h2>
          {user ? (
            <div>
              <p>👤 {user.email || user.user_metadata?.email || 'Email not available'}</p>
              <p>ID: {user.id}</p>
              <button 
                onClick={signOut}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div>
              <p>👤 No user signed in</p>
              <button 
                onClick={signInWithGoogle}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold mb-2">Project Details:</h2>
          <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('zkezubbjstrixkpqjias') ? '✅ Connected to correct project' : '⚠️ Project ID mismatch'}</p>
        </div>
      </div>
    </div>
  );
}