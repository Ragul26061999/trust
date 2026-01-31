'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Avatar,
  IconButton,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Camera as CameraIcon } from 'lucide-react';

interface UserProfile {
  full_name?: string;
  email: string;
  phone?: string;
  age?: number;
  bio?: string;
  avatar_url?: string;
  is_first_time_login?: boolean;
}

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  isFirstTime?: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, isFirstTime = false }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing profile data when modal opens (for editing)
  useEffect(() => {
    if (open && !isFirstTime && user) {
      loadProfile();
    }
  }, [open, isFirstTime, user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          throw error;
        }

        if (data) {
          setProfile(data);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string | number) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const profileData = {
        ...profile,
        user_id: user.id,
        is_first_time_login: false,
        updated_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured() && supabase) {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        let result;
        if (existingProfile) {
          // Update existing profile
          result = await supabase
            .from('user_profiles')
            .update(profileData)
            .eq('user_id', user.id);
        } else {
          // Insert new profile
          result = await supabase
            .from('user_profiles')
            .insert(profileData);
        }

        if (result.error) {
          throw result.error;
        }
      }

      setSuccess(isFirstTime ? 'Profile created successfully!' : 'Profile updated successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);

    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfile(prev => ({
          ...prev,
          avatar_url: result,
        }));
        setError(null); // Clear any previous errors
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: isFirstTime ? 'primary.light' : 'background.paper',
      }}>
        <Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 700, color: isFirstTime ? 'primary.main' : 'text.primary' }}>
            {isFirstTime ? 'Complete Your Profile' : 'Edit Profile'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {isFirstTime 
              ? 'Welcome! Please tell us a bit about yourself to get started.'
              : 'Update your personal information and preferences.'
            }
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Avatar Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 , mt: 2 }}>
          <Avatar
            src={profile.avatar_url}
            sx={{ 
              width: 80, 
              height: 80, 
              mr: 3,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              fontWeight: 600,
            }}
          >
            {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Profile Picture
            </Typography>
            <input
              accept="image/*"
              id="avatar-upload"
              type="file"
              hidden
              onChange={handleAvatarChange}
            />
            <label htmlFor="avatar-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CameraIcon size={18} />}
                size="small"
              >
                {profile.avatar_url ? 'Change Photo' : 'Upload Photo'}
              </Button>
            </label>
          </Box>
        </Box>

        {/* Form Fields */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={profile.full_name || ''}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email"
              value={profile.email}
              disabled
              variant="outlined"
              sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                '& .MuiInputBase-input.Mui-disabled': { 
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)', // For better visibility
                  color: 'text.primary',
                },
              }}
              helperText="Email cannot be changed"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Phone Number"
              value={profile.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              variant="outlined"
              placeholder="+1 (555) 123-4567"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={profile.age || ''}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || '')}
              variant="outlined"
              inputProps={{ min: 1, max: 120 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Bio"
              multiline
              rows={4}
              value={profile.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              variant="outlined"
              placeholder="Tell us about yourself, your interests, and what you're passionate about..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          {isFirstTime ? 'Skip for Now' : 'Cancel'}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading}
          sx={{ 
            borderRadius: 2,
            minWidth: 120,
            position: 'relative',
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Saving...
            </>
          ) : (
            isFirstTime ? 'Complete Profile' : 'Save Changes'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileModal;
