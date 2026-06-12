'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import ProtectedLayout from '../protected-layout';
import useTranslations from '../../lib/use-translations';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  IconButton,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  TextField
} from '@mui/material';
import {
  Search as SearchIcon,
  Bell as BellIcon,
  Star as StarIcon,
  MapPin as MapPinIcon,
  Briefcase as BriefcaseIcon,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { getSuggestedUsersInfo, getUserConnectionsInfo, sendConnectionRequest } from '../actions/user-actions';

const SuggestionsContent = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useTranslations('common');
  
  const [loading, setLoading] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [connectionsInfo, setConnectionsInfo] = useState<any>({ connections: [], sentRequests: [], pendingRequests: [] });
  
  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [experienceFilter, setExperienceFilter] = useState('All');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [usersData, connData] = await Promise.all([
          getSuggestedUsersInfo(),
          getUserConnectionsInfo(user.id)
        ]);
        
        // Exclude current user and existing connections
        const existingConnIds = new Set([
          ...(connData.connections || []),
          ...(connData.sentRequests || []),
          ...(connData.pendingRequests || []),
          user.id
        ]);
        
        const availableUsers = usersData.filter(u => !existingConnIds.has(u.id));
        setSuggestedUsers(availableUsers);
        setFilteredUsers(availableUsers);
        setConnectionsInfo(connData);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user]);

  useEffect(() => {
    let result = suggestedUsers;
    
    if (departmentFilter !== 'All') {
      result = result.filter(u => (u.department || 'General').toLowerCase().includes(departmentFilter.toLowerCase()));
    }
    if (roleFilter !== 'All') {
      result = result.filter(u => (u.role || 'Professional').toLowerCase().includes(roleFilter.toLowerCase()));
    }
    if (experienceFilter !== 'All') {
      // Simplistic filtering, just checking if string matches somewhat or parsing
      if (experienceFilter === '1-3 years') {
         result = result.filter(u => String(u.experience).includes('1') || String(u.experience).includes('2') || String(u.experience).includes('3'));
      } else if (experienceFilter === '3-5 years') {
         result = result.filter(u => String(u.experience).includes('4') || String(u.experience).includes('5'));
      } else if (experienceFilter === '5+ years') {
         result = result.filter(u => String(u.experience).includes('6') || String(u.experience).includes('7') || String(u.experience).includes('8') || String(u.experience).includes('9') || String(u.experience).includes('10'));
      }
    }
    
    setFilteredUsers(result);
  }, [departmentFilter, roleFilter, experienceFilter, suggestedUsers]);

  const handleConnect = async (targetId: string) => {
    if (!user) return;
    try {
      await sendConnectionRequest(user.id, targetId, 'Professional');
      // Update local state to remove them from suggestions immediately
      setSuggestedUsers(prev => prev.filter(u => u.id !== targetId));
      setFilteredUsers(prev => prev.filter(u => u.id !== targetId));
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  // Extract unique departments and roles for filters
  const departments = ['All', ...Array.from(new Set(suggestedUsers.map(u => u.department || 'General')))];
  const roles = ['All', ...Array.from(new Set(suggestedUsers.map(u => u.role || 'Professional')))];

  const userName = (user as any)?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6, px: { xs: 2, md: 5 }, pt: 4, overflowX: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={900} sx={{ color: 'text.primary', letterSpacing: '-0.5px' }}>
          Welcome, {userName.charAt(0).toUpperCase() + userName.slice(1)}!
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <IconButton sx={{ bgcolor: alpha(theme.palette.action.active, 0.05) }}>
            <BellIcon size={20} />
          </IconButton>
          <Avatar 
            src={(user as any)?.user_metadata?.avatar_url} 
            sx={{ width: 44, height: 44, border: '2px solid', borderColor: 'primary.main', cursor: 'pointer' }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
        </Box>
      </Box>

      {/* Hero / Filter Section */}
      <Box sx={{ 
        bgcolor: alpha(theme.palette.primary.main, 0.04), 
        borderRadius: 6, 
        p: { xs: 3, md: 5 }, 
        mb: 6,
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.1)
      }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 4, color: 'text.secondary', maxWidth: '800px', lineHeight: 1.5 }}>
          Find the best professionals to connect with! Our suggestions will help you expand your network and collaborate effectively.
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 2, 
          bgcolor: 'background.paper', 
          p: 2, 
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <FormControl fullWidth size="small" variant="standard" sx={{ '& .MuiInput-underline:before': { borderBottom: 'none' }, '& .MuiInput-underline:after': { borderBottom: 'none' } }}>
            <InputLabel shrink={false} sx={{ display: departmentFilter !== 'All' ? 'none' : 'block', position: 'absolute', top: 8, left: 14, color: 'text.disabled' }}>Department</InputLabel>
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5), borderRadius: 2, pl: 1, height: 44 }}
              disableUnderline
            >
              {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" variant="standard" sx={{ '& .MuiInput-underline:before': { borderBottom: 'none' }, '& .MuiInput-underline:after': { borderBottom: 'none' } }}>
             <InputLabel shrink={false} sx={{ display: roleFilter !== 'All' ? 'none' : 'block', position: 'absolute', top: 8, left: 14, color: 'text.disabled' }}>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5), borderRadius: 2, pl: 1, height: 44 }}
              disableUnderline
            >
              {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" variant="standard" sx={{ '& .MuiInput-underline:before': { borderBottom: 'none' }, '& .MuiInput-underline:after': { borderBottom: 'none' } }}>
            <InputLabel shrink={false} sx={{ display: experienceFilter !== 'All' ? 'none' : 'block', position: 'absolute', top: 8, left: 14, color: 'text.disabled' }}>Experience</InputLabel>
            <Select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5), borderRadius: 2, pl: 1, height: 44 }}
              disableUnderline
            >
              <MenuItem value="All">All Experience</MenuItem>
              <MenuItem value="1-3 years">1-3 years</MenuItem>
              <MenuItem value="3-5 years">3-5 years</MenuItem>
              <MenuItem value="5+ years">5+ years</MenuItem>
            </Select>
          </FormControl>

          <Button 
            variant="contained" 
            sx={{ 
              minWidth: { xs: '100%', md: '56px' }, 
              width: { xs: '100%', md: '56px' }, 
              height: 44, 
              borderRadius: 3,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          >
            <SearchIcon size={20} />
          </Button>
        </Box>
      </Box>

      {/* Results Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" fontWeight={800}>
            Best for you
          </Typography>
          <Chip label={filteredUsers.length} size="small" sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.action.active, 0.1) }} />
        </Box>
        <Button 
          endIcon={<ChevronRightIcon size={16} />} 
          sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: 'primary.main' } }}
        >
          See all
        </Button>
      </Box>

      {/* Grid of Users */}
      <Grid container spacing={3}>
        {filteredUsers.length > 0 ? filteredUsers.map((userObj, idx) => {
          // Generate a pseudo-random rating between 4.0 and 5.0 for demo purposes
          const rating = (4.0 + (userObj.id.charCodeAt(0) % 11) / 10).toFixed(1);
          const ratingNum = parseFloat(rating);
          const isHighRating = ratingNum >= 4.8;
          
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={userObj.id}>
              <Card sx={{ 
                borderRadius: 6, 
                boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.08)'
                }
              }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                    <Avatar 
                      src={userObj.avatarUrl} 
                      sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontWeight: 800, fontSize: '1.5rem' }}
                    >
                      {userObj.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2, mb: 0.5 }}>
                        {userObj.name.charAt(0).toUpperCase() + userObj.name.slice(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {userObj.role}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          icon={<StarIcon size={14} fill={isHighRating ? theme.palette.success.main : theme.palette.warning.main} color={isHighRating ? "success" : "warning"} />}
                          label={rating}
                          size="small"
                          sx={{ 
                            bgcolor: isHighRating ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                            color: isHighRating ? 'success.main' : 'warning.main',
                            fontWeight: 800,
                            borderRadius: 2,
                            '& .MuiChip-icon': { color: 'inherit', ml: 1 }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MapPinIcon size={12} /> {userObj.department}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BriefcaseIcon size={12} /> {userObj.experience || 'Experience varies'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 'auto' }}>
                    <Chip label="Teamwork" size="small" sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5), fontWeight: 600, fontSize: '0.7rem' }} />
                    <Chip label="Communication" size="small" sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5), fontWeight: 600, fontSize: '0.7rem' }} />
                    <Chip label="+2" size="small" sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5), fontWeight: 600, fontSize: '0.7rem' }} />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 3, borderTop: '1px solid', borderColor: alpha(theme.palette.divider, 0.5) }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block' }}>
                        Ready to connect
                      </Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      onClick={() => handleConnect(userObj.id)}
                      sx={{ 
                        borderRadius: 4, 
                        fontWeight: 700, 
                        textTransform: 'none',
                        px: 3,
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
                      }}
                    >
                      Connect
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        }) : (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" fontWeight={600}>
                No suggestions found matching your criteria.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

    </Box>
  );
};

export default function SuggestionsPage() {
  return (
    <ProtectedLayout>
      <SuggestionsContent />
    </ProtectedLayout>
  );
}
