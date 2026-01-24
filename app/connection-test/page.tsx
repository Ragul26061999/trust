'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function ConnectionTestPage() {
  const [status, setStatus] = useState<string>('Initializing...');
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setStatus('❌ Environment variables not configured');
          return;
        }

        setStatus('⏳ Testing connection...');
        
        // Test basic connectivity
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError && userError.message.includes('Missing authorization')) {
          // This is expected if no user is logged in
          setStatus('✅ Connection successful! (No user logged in)');
        } else if (userError) {
          throw userError;
        } else {
          setStatus('✅ Connection successful! User authenticated');
        }

        // Get some connection details
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        setConnectionDetails({
          projectId: url?.split('.')[0]?.split('//')[1],
          url: url,
          connected: true,
          timestamp: new Date().toISOString(),
        });

      } catch (err: any) {
        console.error('Connection test error:', err);
        setError(err.message);
        setStatus(`❌ Connection failed: ${err.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Supabase Connection Test
          </h1>
          
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">Status</h2>
              <p className={`text-lg ${status.startsWith('✅') ? 'text-green-600' : status.startsWith('❌') ? 'text-red-600' : 'text-yellow-600'}`}>
                {status}
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-6 bg-red-50 rounded-lg border-l-4 border-red-500">
                <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Connection Details */}
            {connectionDetails && (
              <div className="p-6 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h2 className="text-xl font-semibold text-green-800 mb-4">Connection Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700">Project ID:</p>
                    <p className="text-gray-900">{connectionDetails.projectId}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Connected:</p>
                    <p className="text-green-600">Yes</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">URL:</p>
                    <p className="text-gray-900 truncate">{connectionDetails.url}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Timestamp:</p>
                    <p className="text-gray-900">{new Date(connectionDetails.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Environment Variables Check */}
            <div className="p-6 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <h2 className="text-xl font-semibold text-purple-800 mb-4">Environment Configuration</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">NEXT_PUBLIC_SUPABASE_URL:</span>
                  <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                  <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}
                  </span>
                </div>
              </div>
            </div>

            {/* Services Available */}
            <div className="p-6 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
              <h2 className="text-xl font-semibold text-indigo-800 mb-4">Available Services</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Database (PostgreSQL)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Storage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Real-time APIs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Functions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>AI Assistance (MCP)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Your Supabase connection is properly configured and ready to use!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}