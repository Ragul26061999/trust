'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function DebugConnection() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const configured = isSupabaseConfigured();
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        setDetails({
          configured,
          url: url ? `${url.substring(0, 20)}...` : 'missing',
          hasKey,
          supabaseClient: !!supabase,
          isClient: typeof window !== 'undefined'
        });

        if (!configured || !supabase) {
          setConnectionStatus('error');
          return;
        }

        // Test actual connection
        const { data, error } = await supabase.from('notes').select('count').limit(1);
        
        if (error) {
          setDetails((prev: any) => ({ ...prev, error: error.message }));
          setConnectionStatus('error');
        } else {
          setConnectionStatus('success');
          setDetails((prev: any) => ({ ...prev, testSuccess: true }));
        }
      } catch (err) {
        setDetails((prev: any) => ({ ...prev, catchError: err instanceof Error ? err.message : 'Unknown error' }));
        setConnectionStatus('error');
      }
    };

    checkConnection();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: connectionStatus === 'success' ? '#10b981' : connectionStatus === 'error' ? '#ef4444' : '#f59e0b',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        🔌 Supabase: {connectionStatus.toUpperCase()}
      </div>
      {details && (
        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
          <div>✅ Configured: {details.configured ? 'YES' : 'NO'}</div>
          <div>🌐 URL: {details.url}</div>
          <div>🔑 Key: {details.hasKey ? 'SET' : 'MISSING'}</div>
          <div>🖥️ Client: {details.supabaseClient ? 'CREATED' : 'FAILED'}</div>
          {details.error && <div style={{ color: '#fbbf24' }}>❌ {details.error}</div>}
          {details.testSuccess && <div>✅ Connection test passed</div>}
        </div>
      )}
    </div>
  );
}
