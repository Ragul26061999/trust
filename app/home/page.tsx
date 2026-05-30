'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import ProtectedLayout from '../protected-layout';
import useTranslations from '../../lib/use-translations';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  TextField,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Badge,
  InputAdornment,
  Paper,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Home as HomeIcon,
  Bell as BellIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MessageSquare as MessageIcon,
  User as UserIcon,
  MoreHorizontal as MoreIcon,
  Heart as HeartIcon,
  Share2 as ShareIcon,
  Send as SendIcon,
  Image as ImageIcon,
  CheckCircle2 as CheckIcon,
  Briefcase as BriefcaseIcon,
  Plus as PlusIcon,
  Users as UsersIcon,
  TrendingUp as TrendingIcon,
  X as XIcon,
  Edit as EditIcon,
  Trash2 as TrashIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { getProfessionalInfo, getProfessionalTasks, ProfessionalTask } from '../../lib/professional-db';
import { getCalendarEntries, CalendarEntry } from '../../lib/personal-calendar-db';
import { getNotes, addNote, Note, getNotesWithAttachments, addNoteWithAttachments, updateNote, deleteNoteWithAttachments } from '../../lib/notes-db';
import { toggleLike, getPostLikes, getPostComments, addComment, PostLike, PostComment } from '../../lib/social-db';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import Link from 'next/link';
import VoiceSchedulerModal from '../../components/voice-scheduler-modal';
import NoteMediaDisplay from '../../components/note-media-display';
import { getAllUsers, getUserConnectionsInfo, sendConnectionRequest, acceptConnectionRequest, rejectConnectionRequest, removeConnection } from '../actions/user-actions';
import ChatBox from '../../components/chat-box';
import { getUnreadCounts, markMessagesAsRead } from '../../lib/chat-db';
// Lucide Icon Wrapper
const LucideIcon = ({ icon: Icon, size = 20, style = {} }: any) => (
  <Icon size={size} style={style} />
);

const HomeContent = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslations('common');
  
  const [loading, setLoading] = useState(true);
  const [professionalInfo, setProfessionalInfo] = useState<any>(null);
  const [tasks, setTasks] = useState<ProfessionalTask[]>([]);
  const [schedule, setSchedule] = useState<CalendarEntry[]>([]);
  const [posts, setPosts] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [taskLevel, setTaskLevel] = useState('Low');
  const [taskStatus, setTaskStatus] = useState('Pending');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [connectionsInfo, setConnectionsInfo] = useState<{
    connections: string[];
    sentRequests: string[];
    pendingRequests: string[];
  }>({ connections: [], sentRequests: [], pendingRequests: [] });
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Social states
  const [likes, setLikes] = useState<Record<string, PostLike[]>>({});
  const [comments, setComments] = useState<Record<string, PostComment[]>>({});
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [interactionsLoading, setInteractionsLoading] = useState<Record<string, boolean>>({});
  
  // Chat state
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const [chatNotification, setChatNotification] = useState<{ open: boolean; message: string; sender: any } | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const handleOpenChat = async (userObj: any) => {
    setActiveChatUser(userObj);
    if (user?.id && userObj?.id) {
      await markMessagesAsRead(user.id, userObj.id);
      setUnreadCounts(prev => ({ ...prev, [userObj.id]: 0 }));
    }
  };

  // Action Buttons States
  const [selectedImage, setSelectedImage] = useState<{
    name: string;
    type: string;
    size: number;
    data: string; // Base64
  } | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Note | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);

  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Post Menu, Edit and Delete States
  const [postMenuAnchor, setPostMenuAnchor] = useState<{
    anchorEl: HTMLElement;
    postId: string;
    post: Note;
  } | null>(null);
  const [editPostDialogOpen, setEditPostDialogOpen] = useState(false);
  const [editingPostContent, setEditingPostContent] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const handleEditPostClick = () => {
    if (!postMenuAnchor) return;
    setEditingPostId(postMenuAnchor.postId);
    setEditingPostContent(postMenuAnchor.post.content);
    setEditPostDialogOpen(true);
    setPostMenuAnchor(null);
  };

  const handleSaveEditPost = async () => {
    if (!editingPostId || !editingPostContent.trim()) return;
    try {
      const success = await updateNote(editingPostId, { content: editingPostContent });
      if (success) {
        setEditPostDialogOpen(false);
        setEditingPostId(null);
        setEditingPostContent('');
        fetchData();
      } else {
        alert("Failed to update post.");
      }
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleDeletePostClick = () => {
    if (!postMenuAnchor) return;
    setDeletingPostId(postMenuAnchor.postId);
    setDeleteConfirmDialogOpen(true);
    setPostMenuAnchor(null);
  };

  const handleConfirmDeletePost = async () => {
    if (!deletingPostId) return;
    try {
      const success = await deleteNoteWithAttachments(deletingPostId);
      if (success) {
        setDeleteConfirmDialogOpen(false);
        setDeletingPostId(null);
        fetchData();
      } else {
        alert("Failed to delete post.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  useEffect(() => {
    // Update date every minute
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user || !isSupabaseConfigured() || !supabase) return;

    // Listen for incoming messages
    const channel = supabase
      .channel('global_messages_listener')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          
          // Only show notification if the chatbox for this user is NOT open
          setAllUsers(prevUsers => {
            const sender = prevUsers.find(u => u.id === newMsg.sender_id);
            setActiveChatUser((prevActive: any) => {
              if (prevActive?.id !== newMsg.sender_id && sender) {
                setChatNotification({
                  open: true,
                  message: newMsg.content,
                  sender: sender
                });
                setUnreadCounts(counts => ({
                  ...counts,
                  [newMsg.sender_id]: (counts[newMsg.sender_id] || 0) + 1
                }));
              } else if (prevActive?.id === newMsg.sender_id) {
                // If chat is open, immediately mark as read
                markMessagesAsRead(user.id, newMsg.sender_id);
              }
              return prevActive;
            });
            return prevUsers;
          });
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        getProfessionalInfo(user.id),
        getProfessionalTasks(user.id),
        getCalendarEntries(user.id),
        getNotesWithAttachments(user.id),
        getAllUsers(),
        getUserConnectionsInfo(user.id),
        isSupabaseConfigured() && supabase ? supabase!.from('user_profiles').select('avatar_url').eq('user_id', user.id).single() : Promise.resolve({ data: null }),
        getUnreadCounts(user.id)
      ]);

      const info = results[0].status === 'fulfilled' ? results[0].value : null;
      const tasksData = results[1].status === 'fulfilled' ? results[1].value : [];
      const calData = results[2].status === 'fulfilled' ? results[2].value : [];
      const notesData = results[3].status === 'fulfilled' ? results[3].value : [];
      const usersData = results[4].status === 'fulfilled' ? results[4].value : [];
      const connectionsData = results[5].status === 'fulfilled' ? results[5].value : { connections: [], sentRequests: [], pendingRequests: [] };
      const profileData = results[6].status === 'fulfilled' && results[6].value ? (results[6].value as any).data : null;
      const unreadData = results[7].status === 'fulfilled' ? results[7].value : {};

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayTasks = tasksData?.filter((t: any) => t.task_date === todayStr) || [];

      setProfessionalInfo(info);
      setTasks(todayTasks);
      setSchedule(calData);
      setPosts(notesData);
      setAllUsers(usersData.filter(u => u.id !== user.id)); // Exclude current user
      setConnectionsInfo(connectionsData);
      setUserProfile(profileData);
      setUnreadCounts(unreadData);
      setTasks(todayTasks);
      setSchedule(calData || []);
      // Treat notes as posts for the social feed
      const sortedPosts = notesData || [];
      setPosts(sortedPosts);

      // Fetch interactions for visible posts
      if (sortedPosts.length > 0) {
        const postIds = sortedPosts.map((p: any) => p.id);
        const likesData: Record<string, PostLike[]> = {};
        const commentsData: Record<string, PostComment[]> = {};

        await Promise.all(postIds.map(async (id: string) => {
          const [pLikes, pComments] = await Promise.all([
            getPostLikes(id),
            getPostComments(id)
          ]);
          likesData[id] = pLikes;
          commentsData[id] = pComments;
        }));

        setLikes(likesData);
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result as string
      });
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;

    try {
      let finalContent = newPostContent;
      if (selectedDoc) {
        finalContent += `\n\n📄 Linked Document: ${selectedDoc.title}`;
      }

      const noteData = {
        user_id: user.id,
        title: 'Post',
        content: finalContent,
        tags: ['social_post'],
        task_level: taskLevel,
        task_status: taskStatus
      };
      
      let newNote;
      if (selectedImage) {
        const attachment = {
          file_name: selectedImage.name,
          file_type: 'image' as const,
          file_size: selectedImage.size,
          file_data: selectedImage.data,
          mime_type: selectedImage.type
        };
        const result = await addNoteWithAttachments(noteData, [attachment]);
        newNote = result ? result.note : null;
      } else {
        newNote = await addNote(noteData);
      }
      
      if (newNote) {
        setNewPostContent('');
        setSelectedImage(null);
        setSelectedDoc(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    // Optimistic UI update
    const isLiked = likes[postId]?.some(l => l.user_id === user.id);
    const mockLike: PostLike = { id: 'temp', post_id: postId, user_id: user.id, created_at: new Date().toISOString() };
    
    const newLikes = isLiked 
      ? (likes[postId] || []).filter(l => l.user_id !== user.id)
      : [...(likes[postId] || []), mockLike];
      
    setLikes(prev => ({ ...prev, [postId]: newLikes }));

    try {
      const result = await toggleLike(postId, user.id);
      if (!result) {
        // Revert if error
        setLikes(prev => ({ ...prev, [postId]: likes[postId] || [] }));
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleUpdateStatus = async (postId: string, newStatus: string) => {
    try {
      setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, task_status: newStatus } : p));
      await updateNote(postId, { task_status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      fetchData(); // revert on error
    }
  };

  const handleOpenComments = (postId: string) => {
    setActivePostId(postId);
    setCommentDialogOpen(true);
  };

  const handleAddComment = async () => {
    if (!user || !activePostId || !newComment.trim()) return;

    try {
      const result = await addComment(activePostId, user.id, newComment);
      if (result) {
        setComments(prev => ({
          ...prev,
          [activePostId]: [...(prev[activePostId] || []), result]
        }));
        setNewComment('');
      }
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const handleShare = async (post: Note) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${post.content}\n\nShared from Trust OS`);
      alert('Content copied to clipboard!');
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    if (!user) return;
    try {
      await sendConnectionRequest(user.id, targetUserId);
      setConnectionsInfo(prev => ({ ...prev, sentRequests: [...prev.sentRequests, targetUserId] }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleAcceptRequest = async (targetUserId: string) => {
    if (!user) return;
    try {
      await acceptConnectionRequest(user.id, targetUserId);
      setConnectionsInfo(prev => ({ 
        ...prev, 
        pendingRequests: prev.pendingRequests.filter(id => id !== targetUserId),
        connections: [...prev.connections, targetUserId] 
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejectRequest = async (targetUserId: string) => {
    if (!user) return;
    try {
      await rejectConnectionRequest(user.id, targetUserId);
      setConnectionsInfo(prev => ({ 
        ...prev, 
        pendingRequests: prev.pendingRequests.filter(id => id !== targetUserId)
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveConnection = async (targetUserId: string) => {
    if (!user) return;
    try {
      await removeConnection(user.id, targetUserId);
      setConnectionsInfo(prev => ({ 
        ...prev, 
        connections: prev.connections.filter(id => id !== targetUserId)
      }));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading && !posts.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4, px: { xs: 2, md: 4 }, pt: 3, overflowX: 'hidden' }}>
      {/* Top Header / Search Bar */}
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1000, 
        bgcolor: alpha(theme.palette.background.paper, 0.8), 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1.5,
        px: { xs: 2, md: 4 },
        mb: 4,
        mx: { xs: -2, md: -4 }, // counteract parent padding to make header full width
      }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="h5" fontWeight={900} color="primary" sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              background: 'linear-gradient(45deg, #2563EB 30%, #60A5FA 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              <HomeIcon size={28} />
              {t('home.title')}
            </Typography>
          </Grid>
          
          {/* Search Bar - Full width on mobile, middle on desktop */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 3, md: 2 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('home.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size={18} />
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: 4, 
                  bgcolor: alpha(theme.palette.action.hover, 0.5),
                  '& fieldset': { border: 'none' },
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }
              }}
            />
          </Grid>

          {/* Date and Notification - Right side */}
          <Grid size={{ xs: 6, md: 3 }} sx={{ order: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', lg: 'block' } }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1 }}>
                {format(currentDate, 'EEEE')}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {format(currentDate, 'MMMM do, yyyy')}
              </Typography>
            </Box>
            <Box sx={{ position: 'relative' }}>
              <IconButton sx={{ color: 'text.primary' }}>
                <BellIcon size={22} />
              </IconButton>
              <Box sx={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%', border: '2px solid', borderColor: 'background.paper' }} />
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column: Professional Section */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Box sx={{ position: 'sticky', top: 96 }}>
            <Card sx={{ 
              borderRadius: 6, 
              mb: 4, 
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Box sx={{ height: 100, background: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)' }} />
              <CardContent sx={{ pt: 0, textAlign: 'center', mt: -6 }}>
                <Avatar 
                  src={userProfile?.avatar_url || (user as any)?.user_metadata?.avatar_url}
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    margin: '0 auto', 
                    border: `4px solid ${theme.palette.background.paper}`,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                  }}
                >
                  {user?.email?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" fontWeight={800} sx={{ mt: 2, mb: 0.5 }}>
                  {professionalInfo?.role || 'Professional'}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                  {professionalInfo?.department || 'Department not set'}
                </Typography>
                
                <Divider sx={{ my: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <Typography variant="h6" fontWeight={800}>12</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>COMPLETED</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="h6" fontWeight={800}>84</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>NETWORK</Typography>
                  </Grid>
                </Grid>
              </CardContent>
              <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02), borderTop: '1px solid', borderColor: 'divider' }}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  size="large" 
                  onClick={() => router.push('/professional')}
                  sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                >
                  {t('home.setup_profile')}
                </Button>
              </Box>
            </Card>

            <Card sx={{ 
              borderRadius: 6, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <TrendingIcon size={20} color={theme.palette.secondary.main} />
                  {t('home.trending')}
                </Typography>
                <List disablePadding>
                  {[
                    { tag: '#Productivity', posts: '1.2k' },
                    { tag: '#WorkLife', posts: '850' },
                    { tag: '#TimeOS', posts: '2.4k' },
                    { tag: '#NextGen', posts: '1.5k' }
                  ].map((item) => (
                    <ListItem key={item.tag} sx={{ px: 0, py: 1, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
                      <ListItemText 
                        primary={item.tag} 
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 800, color: 'primary.main' }}
                        secondary={`${item.posts} interactions`}
                        secondaryTypographyProps={{ variant: 'caption', fontWeight: 500 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Middle Column: Post Feed & Tasks */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Create Post Section */}
          <Paper sx={{ 
            p: 3, 
            borderRadius: 6, 
            mb: 4, 
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', gap: 2, mb: selectedImage || selectedDoc ? 1 : 3 }}>
              <Avatar src={userProfile?.avatar_url || (user as any)?.user_metadata?.avatar_url} sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontWeight: 700 }}>{user?.email?.charAt(0).toUpperCase()}</Avatar>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder={t('home.share_thoughts')}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.action.hover, 0.3),
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: theme.palette.primary.main }
                  }
                }}
              />
            </Box>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />

            {/* Image Preview */}
            {selectedImage && (
              <Box sx={{ position: 'relative', display: 'inline-block', mt: 1, mb: 2, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <img 
                  src={selectedImage.data} 
                  alt="Selected Preview" 
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', display: 'block' }} 
                />
                <IconButton 
                  size="small" 
                  onClick={() => setSelectedImage(null)}
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    bgcolor: 'rgba(0,0,0,0.6)', 
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } 
                  }}
                >
                  <XIcon size={16} />
                </IconButton>
              </Box>
            )}

            {/* Document Preview */}
            {selectedDoc && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mb: 2 }}>
                <Chip 
                  label={`Linked Document: ${selectedDoc.title}`} 
                  color="info" 
                  size="small" 
                  onDelete={() => setSelectedDoc(null)}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Level</InputLabel>
                <Select
                  value={taskLevel}
                  label="Level"
                  onChange={(e) => setTaskLevel(e.target.value)}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={taskStatus}
                  label="Status"
                  onChange={(e) => setTaskStatus(e.target.value)}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Add Media">
                  <IconButton 
                    size="small" 
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                  >
                    <ImageIcon size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Add Time">
                  <IconButton 
                    size="small" 
                    onClick={() => setIsVoiceModalOpen(true)}
                    sx={{ color: 'secondary.main', bgcolor: alpha(theme.palette.secondary.main, 0.05) }}
                  >
                    <ClockIcon size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Link Document">
                  <IconButton 
                    size="small" 
                    onClick={() => setIsDocDialogOpen(true)}
                    sx={{ color: 'info.main', bgcolor: alpha(theme.palette.info.main, 0.05) }}
                  >
                    <BriefcaseIcon size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Button 
                variant="contained" 
                disabled={!newPostContent.trim()}
                onClick={handleCreatePost}
                sx={{ 
                  borderRadius: 3, 
                  px: 4, 
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                  textTransform: 'none'
                }}
                endIcon={<SendIcon size={16} />}
              >
                {t('home.share_post')}
              </Button>
            </Box>
          </Paper>


          {/* Social Feed (Posts) */}
          <Typography variant="h6" fontWeight={900} sx={{ mb: 2.5, letterSpacing: '-0.02em' }}>
            {t('home.recent_activities')}
          </Typography>
          
          {posts.map((post) => (
            <Card key={post.id} sx={{ 
              borderRadius: 6, 
              mb: 4, 
              boxShadow: '0 4px 25px rgba(0,0,0,0.03)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ pb: 2, px: 3, pt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar src={userProfile?.avatar_url || (user as any)?.user_metadata?.avatar_url} sx={{ width: 44, height: 44, bgcolor: 'secondary.main', fontWeight: 800 }}>
                      {user?.email?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1 }}>{user?.email?.split('@')[0]}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {format(new Date(post.created_at), 'MMM d • h:mm a')}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton 
                    size="small"
                    onClick={(e) => setPostMenuAnchor({ anchorEl: e.currentTarget, postId: post.id, post })}
                  >
                    <MoreIcon size={22} />
                  </IconButton>
                </Box>
                {(() => {
                  const hasAttachments = !!(
                    (post as any).note_attachments?.length > 0 || 
                    (post as any).drawing_thumbnail || 
                    (post as any).audio_recording_url
                  );
                  return (
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ 
                          whiteSpace: 'pre-wrap', 
                          lineHeight: 1.6,
                          color: 'text.primary',
                          fontWeight: 400
                        }}>
                          {post.content}
                        </Typography>
                      </Grid>
                      {hasAttachments && (
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ width: '100%', mt: 1 }}>
                            <NoteMediaDisplay 
                              attachments={(post as any).note_attachments} 
                              drawingData={(post as any).drawing_data}
                              drawingThumbnail={(post as any).drawing_thumbnail}
                              audioRecordingUrl={(post as any).audio_recording_url}
                              isDrawing={(post as any).is_drawing}
                              isRecording={(post as any).is_recording}
                              compact={false} 
                            />
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  );
                })()}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  <Chip label="#update" size="small" sx={{ fontWeight: 700, height: 24, bgcolor: alpha(theme.palette.secondary.main, 0.08), color: 'secondary.main', border: 'none' }} />
                  {post.tags?.map(tag => (
                    <Chip key={tag} label={`#${tag}`} size="small" sx={{ fontWeight: 700, height: 24, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', border: 'none' }} />
                  ))}
                </Box>
              </CardContent>
              <Divider sx={{ opacity: 0.6 }} />
                <Box sx={{ 
                  p: 1.5, 
                  px: 3, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  bgcolor: theme.palette.mode === 'dark' ? alpha('#000', 0.2) : alpha(theme.palette.primary.main, 0.02),
                  borderTop: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.5)
                }}>
                  {/* Level Section */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Level
                    </Typography>
                    <Chip 
                      label={post.task_level || 'Low'}
                      size="small"
                      sx={{ 
                        fontWeight: 800, 
                        height: 24,
                        fontSize: '0.75rem',
                        bgcolor: (post.task_level || 'Low') === 'High' ? alpha(theme.palette.error.main, 0.1) : ((post.task_level || 'Low') === 'Medium' ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.success.main, 0.1)),
                        color: (post.task_level || 'Low') === 'High' ? 'error.main' : ((post.task_level || 'Low') === 'Medium' ? 'warning.main' : 'success.main'),
                        border: '1px solid',
                        borderColor: (post.task_level || 'Low') === 'High' ? alpha(theme.palette.error.main, 0.3) : ((post.task_level || 'Low') === 'Medium' ? alpha(theme.palette.warning.main, 0.3) : alpha(theme.palette.success.main, 0.3)),
                      }} 
                    />
                  </Box>

                  {/* Status Section */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Status
                    </Typography>
                    <Select
                      size="small"
                      value={post.task_status || 'Pending'}
                      onChange={(e) => handleUpdateStatus(post.id, e.target.value)}
                      sx={{ 
                        height: 32, 
                        fontSize: '0.8rem', 
                        fontWeight: 800, 
                        color: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        borderRadius: 3,
                        transition: 'all 0.2s',
                        '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                        '.MuiSelect-select': { py: 0.5, pl: 2, pr: 4, display: 'flex', alignItems: 'center' },
                      }}
                    >
                      <MenuItem value="Pending" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>⏳ Pending</MenuItem>
                      <MenuItem value="In Progress" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>🚀 In Progress</MenuItem>
                      <MenuItem value="Completed" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>✅ Completed</MenuItem>
                    </Select>
                  </Box>

                  {/* Share Section */}
                  <Button 
                    startIcon={<ShareIcon size={16} />} 
                    onClick={() => handleShare(post)}
                    variant="contained"
                    sx={{ 
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: 'info.main',
                      fontWeight: 800, 
                      fontSize: '0.8rem',
                      px: 2,
                      py: 0.75,
                      borderRadius: 3,
                      boxShadow: 'none',
                      textTransform: 'none', 
                      '&:hover': { 
                        bgcolor: alpha(theme.palette.info.main, 0.2),
                        boxShadow: 'none',
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    Share
                  </Button>
                </Box>
            </Card>
          ))}
        </Grid>


        {/* Right Column: Notifications & Schedule */}
        <Grid size={{ xs: 12, md: 3 }}>
          {/* Schedule Section */}
          <Card sx={{ 
            borderRadius: 6, 
            mb: 4, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <CardContent sx={{ pb: 2 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <CalendarIcon size={20} color={theme.palette.primary.main} />
                {t('home.my_schedule')}
              </Typography>
              
              <List disablePadding>
                {schedule.length > 0 ? (
                  schedule.slice(0, 5).map((entry) => (
                    <ListItem key={entry.id} sx={{ px: 0, py: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5), '&:last-child': { borderBottom: 'none' } }}>
                      <Box sx={{ 
                        width: 48, 
                        height: 48,
                        textAlign: 'center', 
                        mr: 2, 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Typography variant="caption" fontWeight={900} color="primary" sx={{ display: 'block', lineHeight: 1, fontSize: '1rem' }}>
                          {format(new Date(entry.entry_date), 'dd')}
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="primary" sx={{ display: 'block', textTransform: 'uppercase', fontSize: '0.6rem', opacity: 0.8 }}>
                          {format(new Date(entry.entry_date), 'MMM')}
                        </Typography>
                      </Box>
                      <ListItemText 
                        primary={entry.title}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 800, noWrap: true }}
                        secondary={format(new Date(entry.entry_date), 'h:mm a')}
                        secondaryTypographyProps={{ variant: 'caption', fontWeight: 600 }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      No events scheduled.
                    </Typography>
                  </Box>
                )}
              </List>
              
              <Button 
                fullWidth 
                variant="outlined" 
                size="medium" 
                sx={{ mt: 2, borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                onClick={() => router.push('/calendar')}
              >
                Open Calendar
              </Button>
            </CardContent>
          </Card>

          {/* People to Connect */}
          <Card sx={{ 
            borderRadius: 6, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <UsersIcon size={20} color={theme.palette.info.main} />
                {t('home.connections')}
              </Typography>
              
              <List disablePadding>
                {allUsers.length > 0 ? allUsers.map((person, idx) => {
                  const isConnected = connectionsInfo.connections.includes(person.id);
                  const isSent = connectionsInfo.sentRequests.includes(person.id);
                  const isPending = connectionsInfo.pendingRequests.includes(person.id);
                  
                  const displayName = person.name ? person.name.charAt(0).toUpperCase() + person.name.slice(1) : 'Unknown';
                  const unreadMsgCount = unreadCounts[person.id] || 0;

                  return (
                    <ListItem key={person.id} sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar sx={{ minWidth: 50 }}>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          color="success" // Assuming everyone online for demo or use logic
                          sx={{ '& .MuiBadge-badge': { width: 10, height: 10, borderRadius: '50%', border: '2px solid white' } }}
                        >
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                            badgeContent={unreadMsgCount}
                            color="error"
                          >
                            <Avatar src={person.avatarUrl} sx={{ width: 40, height: 40, bgcolor: theme.palette.info.main, fontWeight: 800 }}>
                              {!person.avatarUrl && displayName[0]}
                            </Avatar>
                          </Badge>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={displayName}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 800 }}
                        secondary={person.email}
                        secondaryTypographyProps={{ variant: 'caption', fontWeight: 500 }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {isConnected ? (
                          <>
                            <Tooltip title="Message">
                              <IconButton 
                                size="small" 
                                onClick={() => handleOpenChat(person)}
                                sx={{ color: 'success.main', bgcolor: alpha(theme.palette.success.main, 0.1) }}
                              >
                                <MessageIcon size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Disconnect">
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveConnection(person.id)}
                                sx={{ color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) }}
                              >
                                <XIcon size={16} />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : isPending ? (
                          <>
                            <Button size="small" variant="contained" color="primary" sx={{ minWidth: 0, px: 1, borderRadius: 2 }} onClick={() => handleAcceptRequest(person.id)}>Accept</Button>
                            <Button size="small" variant="outlined" color="error" sx={{ minWidth: 0, px: 1, borderRadius: 2 }} onClick={() => handleRejectRequest(person.id)}>Decline</Button>
                          </>
                        ) : isSent ? (
                          <Button size="small" variant="outlined" color="inherit" sx={{ minWidth: 0, px: 1, borderRadius: 2, fontSize: '0.75rem', fontWeight: 700 }} disabled>Pending</Button>
                        ) : (
                          <Tooltip title="Connect">
                            <IconButton 
                              size="small" 
                              onClick={() => handleSendRequest(person.id)}
                              sx={{ color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                            >
                              <PlusIcon size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </ListItem>
                  );
                }) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No other users found.
                  </Typography>
                )}
              </List>
              
              <Button 
                fullWidth 
                variant="text" 
                size="small" 
                sx={{ mt: 1, fontWeight: 700, textTransform: 'none' }}
              >
                {t('home.view_suggestions')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      {/* Comment Dialog */}
      <Dialog 
        open={commentDialogOpen} 
        onClose={() => setCommentDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 6, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Comments</DialogTitle>
        <DialogContent dividers>
          <List>
            {(comments[activePostId || ''] || []).length > 0 ? (
              (comments[activePostId || ''] || []).map((comment) => (
                <ListItem key={comment.id} alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: 'primary.main' }}>
                      {comment.user_id.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight={800}>User</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                        </Typography>
                      </Box>
                    }
                    secondary={comment.content}
                    secondaryTypographyProps={{ sx: { color: 'text.primary', mt: 0.5 } }}
                  />
                </ListItem>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No comments yet. Be the first to share your thoughts!
              </Typography>
            )}
          </List>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1.5 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCommentDialogOpen(false)} sx={{ fontWeight: 700 }}>Close</Button>
          <Button 
            onClick={handleAddComment} 
            variant="contained" 
            disabled={!newComment.trim()}
            sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}
          >
            Post Comment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Voice Scheduler Modal */}
      {user && (
        <VoiceSchedulerModal 
          open={isVoiceModalOpen} 
          onClose={() => setIsVoiceModalOpen(false)} 
          userId={user.id} 
          onSuccess={() => {
            fetchData();
          }} 
        />
      )}

      {/* Link Document Dialog */}
      <Dialog
        open={isDocDialogOpen}
        onClose={() => setIsDocDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: { borderRadius: 6, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Link Recent Document</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: '300px', p: 1 }}>
          {posts.length > 0 ? (
            <List>
              {posts.map((note) => (
                <ListItemButton 
                  key={note.id} 
                  onClick={() => {
                    setSelectedDoc(note);
                    setIsDocDialogOpen(false);
                  }}
                  sx={{ 
                    borderRadius: 3, 
                    mb: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                      <BriefcaseIcon size={20} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={note.title || "Untitled"}
                    primaryTypographyProps={{ fontWeight: 700, variant: 'body2' }}
                    secondary={note.content.length > 30 ? note.content.substring(0, 30) + '...' : note.content}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No documents found to link.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDocDialogOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Post Action Menu */}
      <Menu
        anchorEl={postMenuAnchor?.anchorEl}
        open={Boolean(postMenuAnchor)}
        onClose={() => setPostMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 3,
            minWidth: 150,
            mt: 0.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }
        }}
      >
        <MenuItem onClick={handleEditPostClick} sx={{ fontWeight: 600 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <EditIcon size={16} />
          </ListItemIcon>
          Edit Post
        </MenuItem>
        <MenuItem onClick={handleDeletePostClick} sx={{ fontWeight: 600, color: 'error.main' }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <TrashIcon size={16} style={{ color: theme.palette.error.main }} />
          </ListItemIcon>
          Delete Post
        </MenuItem>
      </Menu>

      {/* Edit Post Dialog */}
      <Dialog
        open={editPostDialogOpen}
        onClose={() => setEditPostDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 6, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Edit Post</DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editingPostContent}
            onChange={(e) => setEditingPostContent(e.target.value)}
            variant="outlined"
            placeholder="Edit your post thoughts..."
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 4,
                bgcolor: alpha(theme.palette.action.hover, 0.1),
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditPostDialogOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button 
            onClick={handleSaveEditPost} 
            variant="contained" 
            disabled={!editingPostContent.trim()}
            sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Post Dialog */}
      <Dialog
        open={deleteConfirmDialogOpen}
        onClose={() => setDeleteConfirmDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 6, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: 'error.main' }}>Delete Post</DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Typography variant="body1" fontWeight={500}>
            Are you sure you want to delete this post? This action is permanent and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmDialogOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button 
            onClick={handleConfirmDeletePost} 
            variant="contained" 
            color="error"
            sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}
          >
            Delete Post
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat Notification Snackbar */}
      <Snackbar 
        open={chatNotification?.open || false} 
        autoHideDuration={5000} 
        onClose={() => setChatNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setChatNotification(null)} 
          severity="info" 
          icon={false}
          sx={{ width: '100%', cursor: 'pointer', borderRadius: 3, boxShadow: 3, p: 2, display: 'flex', alignItems: 'center' }}
          onClick={() => {
            if (chatNotification?.sender) {
              handleOpenChat(chatNotification.sender);
            }
            setChatNotification(null);
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={chatNotification?.sender?.avatarUrl} sx={{ width: 40, height: 40 }}>
              {!chatNotification?.sender?.avatarUrl && ((chatNotification?.sender?.name?.[0] || 'U').toUpperCase())}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                New message from {chatNotification?.sender?.name ? chatNotification.sender.name.charAt(0).toUpperCase() + chatNotification.sender.name.slice(1) : 'Unknown'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>
                {chatNotification?.message}
              </Typography>
            </Box>
          </Box>
        </Alert>
      </Snackbar>

      {/* Chat Widget */}
      {activeChatUser && (
        <ChatBox 
          currentUser={user} 
          recipientUser={activeChatUser} 
          onClose={() => setActiveChatUser(null)} 
        />
      )}
    </Box>
  );
};

export default function HomePage() {
  return (
    <ProtectedLayout>
      <HomeContent />
    </ProtectedLayout>
  );
}
