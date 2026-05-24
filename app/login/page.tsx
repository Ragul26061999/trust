'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import TranslatedText from '../../components/translated-text';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login, signInWithGoogle } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [greeting, setGreeting] = useState('Welcome Back');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Get URL parameters using searchParams hook
  useEffect(() => {
    if (searchParams) {
      const urlError = searchParams.get('error');
      const email = searchParams.get('email');
      
      if (urlError === 'invalid_email_domain' && email) {
        setError(`Only Gmail accounts are allowed. ${email} is not a Gmail account.`);
      }
    }
  }, [searchParams]);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Attempt to log in using Supabase auth
      const success = await login(username, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white font-sans">
      
      {/* LEFT SIDE - App Concept & Brand (Pastel Blue Theme) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#f0f7ff] p-12 relative overflow-hidden">
        {/* Pastel blue decorative ambient background */}
        <div className="absolute top-[-15%] left-[-10%] w-[50rem] h-[50rem] bg-[#e0efff] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[40rem] h-[40rem] bg-[#dbeafe] rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Header / Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">Trust App</span>
        </div>

        {/* Main Concept Text */}
        <div className="relative z-10 max-w-lg mb-12">
          <h1 className="text-4xl xl:text-5xl font-extrabold text-slate-900 leading-[1.15] mb-6">
            Simplify your <span className="text-blue-600">daily life</span> with smart analytics.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            Our platform provides intelligent insights, seamless organization, and powerful tools designed to help you focus on what truly matters in your day-to-day routine.
          </p>
          
          {/* Subtle UI mockup illustration or cards can go here to fill space */}
          <div className="flex gap-4">
             <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/50 w-48">
                <div className="h-2 w-1/2 bg-blue-200 rounded-full mb-3"></div>
                <div className="h-2 w-full bg-slate-100 rounded-full mb-2"></div>
                <div className="h-2 w-3/4 bg-slate-100 rounded-full"></div>
             </div>
             <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/50 w-48 mt-8">
                <div className="h-2 w-1/2 bg-indigo-200 rounded-full mb-3"></div>
                <div className="h-2 w-full bg-slate-100 rounded-full mb-2"></div>
                <div className="h-2 w-4/5 bg-slate-100 rounded-full"></div>
             </div>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="relative z-10 text-slate-500 text-sm font-medium">
          © {new Date().getFullYear()} Trust Application. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE - Login Box */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white relative overflow-y-auto">
        
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl">
          <div className="text-left">
            {/* Mobile Logo visible only on small screens */}
            <div className="lg:hidden h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <TranslatedText 
              text={greeting} 
              sx={{ fontWeight: 800, fontSize: '2rem', mb: 1.5, color: '#0f172a', display: 'block', letterSpacing: '-0.025em' }} 
            />
            <TranslatedText 
              text="Please sign in to your account to continue" 
              sx={{ color: '#64748b', fontSize: '1rem' }} 
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-5 mt-8">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 hover:border-slate-300 text-slate-900 placeholder-slate-400 outline-none"
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="space-y-2 relative">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 hover:border-slate-300 text-slate-900 placeholder-slate-400 outline-none pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] flex justify-center items-center transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>

          <button
            onClick={async () => {
              setError('');
              try {
                await signInWithGoogle();
              } catch (err: any) {
                console.error('Google sign in error:', err);
                setError(err?.message || 'Failed to sign in with Google');
              }
            }}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all duration-200 hover:border-slate-300 shadow-sm"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="text-center mt-8">
            <p className="text-sm text-slate-500">Only Google Workspace accounts are permitted</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}