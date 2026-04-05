'use client';

import { useAuth } from '../lib/auth-context';
import Link from 'next/link';
import TranslatedText from './translated-text';

export default function UserNav() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center space-x-4">
      {user ? (
        <>
          <TranslatedText text="Welcome," sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }} />
          <span className="text-sm text-gray-300">{user.email}</span>
          <button 
            onClick={logout}
            className="text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md transition-colors duration-200"
          >
            Logout
          </button>
        </>
      ) : (
        <Link href="/login" className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md transition-colors duration-200">
          Login
        </Link>
      )}
    </div>
  );
}