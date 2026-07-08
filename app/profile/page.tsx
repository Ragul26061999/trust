'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  Divider,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  alpha
} from '@mui/material';
import {
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  Edit as EditIcon,
  MapPin,
  Building,
  Facebook,
  Youtube,
  Instagram,
  Linkedin,
  Grid as GridIcon
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getNotesWithAttachments, Note } from '../../lib/notes-db';
import { getBannerPreferences, saveBannerPreferences, getUserConnectionsInfo } from '../actions/user-actions';
import { getCalendarEntries } from '../../lib/personal-calendar-db';
import { getProfessionalTasks } from '../../lib/professional-db';
import ProfileModal from '../../components/profile-modal';
import ProtectedLayout from '../protected-layout';

let cachedProfileData: any = null;

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(!cachedProfileData);
  const [userProfile, setUserProfile] = useState<any>(cachedProfileData?.userProfile || null);
  const [posts, setPosts] = useState<Note[]>(cachedProfileData?.posts || []);
  const [bannerColor, setBannerColor] = useState<string | null>(cachedProfileData?.bannerColor || null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(cachedProfileData?.bannerUrl || null);
  const [connectionsInfo, setConnectionsInfo] = useState<{ connections: string[] }>(cachedProfileData?.connectionsInfo || { connections: [] });

  const [personalStats, setPersonalStats] = useState<any>(cachedProfileData?.personalStats || { completed: 0, inProcess: 0, incomplete: 0, total: 0, completedPct: '0%', inProcessPct: '0%', incompletePct: '0%' });
  const [professionalStats, setProfessionalStats] = useState<any>(cachedProfileData?.professionalStats || { completed: 0, inProcess: 0, incomplete: 0, total: 0, completedPct: '0%', inProcessPct: '0%', incompletePct: '0%' });
  const [notesStats, setNotesStats] = useState<any>(cachedProfileData?.notesStats || { completed: 0, inProcess: 0, incomplete: 0, total: 0, completedPct: '0%', inProcessPct: '0%', incompletePct: '0%' });
  const [posterStats, setPosterStats] = useState<any>(cachedProfileData?.posterStats || { completed: 0, inProcess: 0, incomplete: 0, total: 0, completedPct: '0%', inProcessPct: '0%', incompletePct: '0%' });

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  
  const [tempBannerColor, setTempBannerColor] = useState('#2563EB');
  const [tempBannerUrl, setTempBannerUrl] = useState('');

  const [routinesOpen, setRoutinesOpen] = useState(false);
  const [routinesData, setRoutinesData] = useState<any>(null);
  const [routinesLoading, setRoutinesLoading] = useState(false);

  const calculateStats = (tasks: any[]) => {
    const total = tasks.length;
    if (total === 0) return { completed: 0, inProcess: 0, incomplete: 0, total: 0, completedPct: '0%', inProcessPct: '0%', incompletePct: '0%' };

    let completed = 0;
    let inProcess = 0;
    let incomplete = 0;

    tasks.forEach(task => {
      const status = (task.status || task.task_status || 'pending').toLowerCase();
      if (status === 'completed') {
        completed++;
      } else if (status === 'in process' || status === 'in-progress') {
        inProcess++;
      } else {
        incomplete++;
      }
    });

    return {
      completed,
      inProcess,
      incomplete,
      total,
      completedPct: Math.round((completed / total) * 100) + '%',
      inProcessPct: Math.round((inProcess / total) * 100) + '%',
      incompletePct: Math.round((incomplete / total) * 100) + '%'
    };
  };

  const fetchProfileData = async () => {
    if (!user) return;
    try {
      if (!cachedProfileData) setLoading(true);
      const results = await Promise.allSettled([
        getNotesWithAttachments(user.id),
        isSupabaseConfigured() && supabase ? supabase.from('user_profiles').select('*').eq('user_id', user.id).single() : Promise.resolve({ data: null }),
        getBannerPreferences(user.id),
        getUserConnectionsInfo(user.id),
        getCalendarEntries(user.id),
        getProfessionalTasks(user.id)
      ]);

      const notesData = results[0].status === 'fulfilled' ? results[0].value : [];
      const profileData = results[1].status === 'fulfilled' && results[1].value ? (results[1].value as any).data : null;
      const bannerData = results[2].status === 'fulfilled' ? (results[2].value as any) : { bannerColor: null, bannerUrl: null };
      const connsData = results[3].status === 'fulfilled' ? (results[3].value as any) : { connections: [] };
      const personalTasks = results[4].status === 'fulfilled' ? results[4].value : [];
      const professionalTasks = results[5].status === 'fulfilled' ? results[5].value : [];

      setPosts(notesData || []);
      setUserProfile(profileData);
      setBannerColor(bannerData.bannerColor);
      setBannerUrl(bannerData.bannerUrl);
      setTempBannerColor(bannerData.bannerColor || '#2563EB');
      setTempBannerUrl(bannerData.bannerUrl || '');
      setConnectionsInfo(connsData);
      
      setPersonalStats(calculateStats(personalTasks || []));
      setProfessionalStats(calculateStats(professionalTasks || []));
      
      const noteTakingData = (notesData || []).filter((note: any) => !note.tags?.includes('social_post'));
      const posterData = (notesData || []).filter((note: any) => note.tags?.includes('social_post'));
      setNotesStats(calculateStats(noteTakingData));
      setPosterStats(calculateStats(posterData));
      
      cachedProfileData = {
        userProfile: profileData,
        posts: notesData || [],
        bannerColor: bannerData.bannerColor,
        bannerUrl: bannerData.bannerUrl,
        connectionsInfo: connsData,
        personalStats: calculateStats(personalTasks || []),
        professionalStats: calculateStats(professionalTasks || []),
        notesStats: calculateStats(noteTakingData),
        posterStats: calculateStats(posterData)
      };
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const handleOpenRoutines = async () => {
    setRoutinesOpen(true);
    setRoutinesLoading(true);
    try {
      if (!user || !supabase) return;
      const prefRes = await supabase.from('user_preferences').select('default_sleep_start, default_sleep_end').eq('user_id', user.id).single();
      const breaksRes = await supabase.from('user_breaks').select('*').eq('user_id', user.id).order('start_time', { ascending: true });
      
      setRoutinesData({
        sleep_start: prefRes.data?.default_sleep_start || 'Not set',
        sleep_end: prefRes.data?.default_sleep_end || 'Not set',
        breaks: breaksRes.data || []
      });
    } catch (e) {
      console.error('Error fetching routines:', e);
    } finally {
      setRoutinesLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSaveBanner = async () => {
    if (!user) return;
    try {
      await saveBannerPreferences(user.id, tempBannerColor, tempBannerUrl || null);
      setBannerColor(tempBannerColor);
      setBannerUrl(tempBannerUrl || null);
      setBannerDialogOpen(false);
    } catch (error) {
      console.error("Error saving banner:", error);
    }
  };

  // Color values adapting to the theme
  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? '#18181A' : theme.palette.background.paper;
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider;
  const textPrimary = isDark ? '#ffffff' : theme.palette.text.primary;
  const textSecondary = isDark ? '#A1A1AA' : theme.palette.text.secondary;
  const pageBg = isDark ? '#000000' : theme.palette.background.default;

  return (
    <ProtectedLayout>
      <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: pageBg, pb: 10, overflowX: 'hidden' }}>
        {/* Banner Section */}
        <Box 
          onClick={() => setBannerDialogOpen(true)}
          sx={{ 
            height: { xs: 150, md: 220 }, 
            width: '100%',
            background: bannerUrl ? `url(${bannerUrl}) center/cover` : (bannerColor || 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)'),
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${cardBorder}`,
            '&:hover': {
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
              },
              '& .edit-icon': { display: 'flex' }
            }
          }} 
        >
          <Box className="edit-icon" sx={{ 
            display: 'none', 
            alignItems: 'center', 
            gap: 1, 
            color: 'white', 
            zIndex: 1, 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            bgcolor: 'rgba(0,0,0,0.6)', 
            borderRadius: 2, 
            p: 1,
            px: 1.5
          }}>
            <EditIcon size={18} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Edit Banner</Typography>
          </Box>
        </Box>

        {/* Profile Info Card */}
        <Box sx={{ maxWidth: 1100, margin: '0 auto', px: { xs: 2, md: 4 }, position: 'relative', zIndex: 2, mt: { xs: -6, md: -8 }, mb: 4 }}>
          <Box sx={{ 
            bgcolor: cardBg, 
            borderRadius: 4, 
            p: { xs: 3, md: 4 }, 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'center' },
            border: `1px solid ${cardBorder}`,
            boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.05)',
            gap: 4
          }}>
             {/* Left side: Avatar and Info */}
             <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 4 }, alignItems: 'center', textAlign: { xs: 'center', sm: 'left' } }}>
                <Avatar 
                  src={userProfile?.avatar_url || (user as any)?.user_metadata?.avatar_url}
                  sx={{ 
                    width: { xs: 100, md: 140 }, 
                    height: { xs: 100, md: 140 }, 
                    border: `4px solid ${cardBg}`,
                    bgcolor: 'primary.main',
                    fontSize: '3rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                  }}
                >
                  {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </Avatar>
                
                <Box>
                   <Typography variant="h4" sx={{ fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1.5, mb: 1 }}>
                     {userProfile?.full_name || user?.email?.split('@')[0]}
                   </Typography>
                   
                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, color: textSecondary }}>
                     <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1.5 }}>
                       {userProfile?.email || user?.email || 'No email provided'}
                     </Typography>
                     {userProfile?.phone && (
                       <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1.5 }}>
                         {userProfile.phone}
                       </Typography>
                     )}
                     {userProfile?.bio && (
                       <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1.5, mt: 0.5, fontStyle: 'italic' }}>
                         {userProfile.bio}
                       </Typography>
                     )}
                   </Box>

                   {/* Action Buttons */}
                   <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => setEditProfileOpen(true)}
                        sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: textPrimary, borderRadius: 2, textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', boxShadow: 'none' } }}
                      >
                        Edit Profile
                      </Button>
                      <IconButton 
                        size="small"
                        onClick={handleOpenRoutines}
                        sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: textPrimary, borderRadius: 2, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' } }}
                      >
                        <SettingsIcon size={18} />
                      </IconButton>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={handleLogout}
                        sx={{ borderColor: cardBorder, color: '#f87171', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: 'rgba(248,113,113,0.1)', borderColor: '#f87171' } }}
                      >
                        Logout
                      </Button>
                   </Box>
                </Box>
             </Box>
          </Box>
        </Box>

        {/* 2-Column Real Task Metrics Row */}
        <Box sx={{ maxWidth: 1100, margin: '0 auto', px: { xs: 2, md: 4 }, mb: 6 }}>
          <Grid container spacing={3}>
             {/* Card 1: Personal Tasks */}
             <Grid size={{ xs: 12, md: 6 }}>
               <Box sx={{ bgcolor: cardBg, borderRadius: 3, p: 4, height: '100%', border: `1px solid ${cardBorder}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: textPrimary, fontWeight: 700 }}>Personal Tasks</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', px: 1.5, py: 0.5, borderRadius: 2 }}>{personalStats.total} Total</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>Completed</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{personalStats.completed} / <Box component="span" sx={{ color: '#4ade80' }}>{personalStats.completedPct}</Box></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>In Process</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{personalStats.inProcess} / <Box component="span" sx={{ color: '#fbbf24' }}>{personalStats.inProcessPct}</Box></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>Incomplete</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{personalStats.incomplete} / <Box component="span" sx={{ color: '#f87171' }}>{personalStats.incompletePct}</Box></Typography>
                  </Box>
               </Box>
             </Grid>
             
             {/* Card 2: Professional Tasks */}
             <Grid size={{ xs: 12, md: 6 }}>
               <Box sx={{ bgcolor: cardBg, borderRadius: 3, p: 4, height: '100%', border: `1px solid ${cardBorder}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: textPrimary, fontWeight: 700 }}>Professional Tasks</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', px: 1.5, py: 0.5, borderRadius: 2 }}>{professionalStats.total} Total</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>Completed</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{professionalStats.completed} / <Box component="span" sx={{ color: '#4ade80' }}>{professionalStats.completedPct}</Box></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>In Process</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{professionalStats.inProcess} / <Box component="span" sx={{ color: '#fbbf24' }}>{professionalStats.inProcessPct}</Box></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>Incomplete</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{professionalStats.incomplete} / <Box component="span" sx={{ color: '#f87171' }}>{professionalStats.incompletePct}</Box></Typography>
                  </Box>
               </Box>
             </Grid>

             {/* Card 3: Notes Taking */}
             <Grid size={{ xs: 12, md: 6 }}>
               <Box sx={{ bgcolor: cardBg, borderRadius: 3, p: 4, height: '100%', border: `1px solid ${cardBorder}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: textPrimary, fontWeight: 700 }}>Notes Taking</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', px: 1.5, py: 0.5, borderRadius: 2 }}>{notesStats.total} Total</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>Completed</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{notesStats.completed} / <Box component="span" sx={{ color: '#4ade80' }}>{notesStats.completedPct}</Box></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>In Process</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{notesStats.inProcess} / <Box component="span" sx={{ color: '#fbbf24' }}>{notesStats.inProcessPct}</Box></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>Incomplete</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{notesStats.incomplete} / <Box component="span" sx={{ color: '#f87171' }}>{notesStats.incompletePct}</Box></Typography>
                  </Box>
               </Box>
             </Grid>

             {/* Card 4: Poster */}
             <Grid size={{ xs: 12, md: 6 }}>
               <Box sx={{ bgcolor: cardBg, borderRadius: 3, p: 4, height: '100%', border: `1px solid ${cardBorder}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ color: textPrimary, fontWeight: 700 }}>Poster</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', px: 1.5, py: 0.5, borderRadius: 2 }}>{posterStats.total} Total</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>Completed</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{posterStats.completed} / <Box component="span" sx={{ color: '#4ade80' }}>{posterStats.completedPct}</Box></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>In Process</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{posterStats.inProcess} / <Box component="span" sx={{ color: '#fbbf24' }}>{posterStats.inProcessPct}</Box></Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 500 }}>Incomplete</Typography>
                     <Typography variant="body1" sx={{ color: textSecondary, fontWeight: 600 }}>{posterStats.incomplete} / <Box component="span" sx={{ color: '#f87171' }}>{posterStats.incompletePct}</Box></Typography>
                  </Box>
               </Box>
             </Grid>
          </Grid>
        </Box>

        {/* Recent Content Grid */}
        <Box sx={{ maxWidth: 1100, margin: '0 auto', px: { xs: 2, md: 4 } }}>
          <Typography variant="h6" sx={{ color: textPrimary, fontWeight: 600, mb: 3, letterSpacing: '-0.01em' }}>
            Recent content
          </Typography>
          
          <Grid container spacing={3}>
            {posts.map((post) => {
              const attachment = (post as any).note_attachments && (post as any).note_attachments.length > 0 ? (post as any).note_attachments[0] : null;
              const isImage = attachment && attachment.file_type === 'image';
              
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={post.id}>
                  <Box sx={{ 
                    position: 'relative', 
                    borderRadius: 3,
                    bgcolor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    height: 280,
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    }
                  }}>
                    {isImage ? (
                      <img 
                        src={attachment.file_data || ''} 
                        alt="Post attachment"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ 
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center',
                      }}>
                        <Typography variant="body1" sx={{ 
                          color: textPrimary,
                          overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', 
                          WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', wordBreak: 'break-word',
                          fontWeight: 500,
                          lineHeight: 1.6
                        }}>
                          {post.content}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {posts.length === 0 && (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid', borderColor: textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GridIcon size={32} color={textSecondary} />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight="bold" color={textSecondary} gutterBottom>No Recent Content</Typography>
            </Box>
          )}
        </Box>

        {/* Profile Edit Modal */}
        <ProfileModal 
          open={editProfileOpen} 
          onClose={() => {
            setEditProfileOpen(false);
            fetchProfileData(); // Refresh data after edit
          }}
          isFirstTime={false}
        />

        {/* Banner Edit Dialog */}
        <Dialog open={bannerDialogOpen} onClose={() => setBannerDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Customize Banner</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Banner Image</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <input 
                    type="text" 
                    value={tempBannerUrl} 
                    onChange={(e) => setTempBannerUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc', background: 'transparent', color: 'inherit' }}
                  />
                  <Button variant="outlined" component="label" sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}>
                    Upload File
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTempBannerUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Paste an image URL, upload a file from your device, or select a template below.
                </Typography>
              </Box>
              
              <Divider>OR</Divider>

              <Box>
                <Typography variant="subtitle2" sx={{ color: textPrimary }} gutterBottom>Banner Color</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#1F2937', '#000000'].map(color => (
                    <Box 
                      key={color}
                      onClick={() => { setTempBannerColor(color); setTempBannerUrl(''); }}
                      sx={{ 
                        width: 40, height: 40, borderRadius: '50%', bgcolor: color, cursor: 'pointer',
                        border: tempBannerColor === color && !tempBannerUrl ? '3px solid white' : 'none',
                        boxShadow: tempBannerColor === color && !tempBannerUrl ? '0 0 0 2px #2563EB' : 'none',
                        transition: 'transform 0.1s',
                        '&:hover': { transform: 'scale(1.1)' }
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ borderColor: cardBorder }}>OR</Divider>

              <Box>
                <Typography variant="subtitle2" sx={{ color: textPrimary }} gutterBottom>Banner Templates</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                  {[
                    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80',
                    'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80',
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
                    'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80'
                  ].map((url, idx) => (
                    <Box 
                      key={idx}
                      onClick={() => setTempBannerUrl(url)}
                      sx={{ 
                        height: 60, 
                        borderRadius: 2, 
                        cursor: 'pointer',
                        background: `url(${url}) center/cover`,
                        border: tempBannerUrl === url ? '3px solid #2563EB' : '2px solid transparent',
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'scale(1.05)', opacity: 0.9 }
                      }}
                    />
                  ))}
                </Box>
              </Box>
              
              <Box sx={{ 
                height: 120, 
                borderRadius: 3, 
                mt: 1,
                background: tempBannerUrl ? `url(${tempBannerUrl}) center/cover` : tempBannerColor,
                border: `1px solid ${cardBorder}`
              }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setBannerDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveBanner}>Save Banner</Button>
          </DialogActions>
        </Dialog>

        {/* Routines / Settings Dialog */}
        <Dialog open={routinesOpen} onClose={() => setRoutinesOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SettingsIcon size={20} color={theme.palette.primary.main} />
              Your Daily Routines
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: '10px !important' }}>
            {routinesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: textSecondary, fontWeight: 700, mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Sleep Schedule
                  </Typography>
                  <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', p: 2, borderRadius: 3, border: `1px solid ${cardBorder}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Bed Time</Typography>
                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                        {routinesData?.sleep_start}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Wake Up</Typography>
                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                        {routinesData?.sleep_end}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: textSecondary, fontWeight: 700, mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Daily Breaks
                  </Typography>
                  {routinesData?.breaks?.length === 0 ? (
                    <Typography variant="body2" sx={{ color: textSecondary, fontStyle: 'italic' }}>No breaks configured.</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {routinesData?.breaks?.map((b: any) => (
                        <Box key={b.id} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', p: 2, borderRadius: 3, border: `1px solid ${cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{b.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700, bgcolor: 'rgba(245, 158, 11, 0.1)', px: 1, py: 0.5, borderRadius: 1.5 }}>
                            {b.start_time.substring(0,5)} - {b.end_time.substring(0,5)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="outlined" onClick={() => router.push('/onboarding/routines')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
              Edit Routines
            </Button>
            <Button variant="contained" onClick={() => setRoutinesOpen(false)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, ml: 'auto' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ProtectedLayout>
  );
}
