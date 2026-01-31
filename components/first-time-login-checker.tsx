'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ProfileModal from './profile-modal';

const FirstTimeLoginChecker: React.FC = () => {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFirstTimeLogin = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        if (isSupabaseConfigured() && supabase) {
          // Check if user has a profile
          const { data, error } = await supabase
            .from('user_profiles')
            .select('is_first_time_login')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error('Error checking profile:', error);
            setLoading(false);
            return;
          }

          // If no profile found or it's first time login, show modal
          if (!data || data.is_first_time_login) {
            setShowProfileModal(true);
          }
        } else {
          // Fallback: check localStorage for demo users
          const profileCheck = localStorage.getItem(`profile_completed_${user.id}`);
          if (!profileCheck) {
            setShowProfileModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking first time login:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFirstTimeLogin();
  }, [user]);

  const handleProfileModalClose = () => {
    setShowProfileModal(false);
    
    // Mark profile as completed in localStorage for demo users
    if (user && !isSupabaseConfigured()) {
      localStorage.setItem(`profile_completed_${user.id}`, 'true');
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  return (
    <ProfileModal 
      open={showProfileModal} 
      onClose={handleProfileModalClose}
      isFirstTime={showProfileModal}
    />
  );
};

export default FirstTimeLoginChecker;
