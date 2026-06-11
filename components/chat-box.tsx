'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Avatar, 
  TextField, 
  Button, 
  Divider, 
  alpha, 
  useTheme,
  Badge
} from '@mui/material';
import { 
  X as XIcon, 
  Minus as MinusIcon, 
  Send as SendIcon,
  Image as ImageIcon,
  Paperclip as PaperclipIcon,
  Smile as SmileIcon
} from 'lucide-react';

import { getMessages, sendMessage, ChatMessage as DBChatMessage } from '../lib/chat-db';
import { supabase } from '../lib/supabase';
import { getUserConnectionsInfo } from '../app/actions/user-actions';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

interface ChatBoxProps {
  currentUser: any;
  recipientUser: any;
  onClose: () => void;
}

export default function ChatBox({ currentUser, recipientUser, onClose }: ChatBoxProps) {
  const theme = useTheme();
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecipientConnectedToMe, setIsRecipientConnectedToMe] = useState<boolean | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (!currentUser?.id || !recipientUser?.id) return;
      try {
        const recipientInfo = await getUserConnectionsInfo(recipientUser.id);
        setIsRecipientConnectedToMe(recipientInfo.connections.includes(currentUser.id));
      } catch (e) {
        console.error(e);
      }
    };
    checkConnection();
  }, [currentUser?.id, recipientUser?.id]);

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, isMinimized]);

  useEffect(() => {
    if (!currentUser?.id || !recipientUser?.id) return;
    
    let isMounted = true;
    
    const loadMessages = async () => {
      setLoading(true);
      const dbMsgs = await getMessages(currentUser.id, recipientUser.id);
      if (isMounted) {
        setMessages(dbMsgs.map(m => ({
          id: m.id,
          senderId: m.sender_id,
          text: m.content,
          timestamp: new Date(m.created_at)
        })));
        setLoading(false);
      }
    };
    
    loadMessages();

    if (!supabase) return;

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_${currentUser.id}_${recipientUser.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `sender_id=in.(${currentUser.id},${recipientUser.id})`
        },
        (payload) => {
          const newMsg = payload.new as DBChatMessage;
          // Only add if it's part of this conversation
          if (
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === recipientUser.id) ||
            (newMsg.sender_id === recipientUser.id && newMsg.receiver_id === currentUser.id)
          ) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.find(p => p.id === newMsg.id)) return prev;
              return [...prev, {
                id: newMsg.id,
                senderId: newMsg.sender_id,
                text: newMsg.content,
                timestamp: new Date(newMsg.created_at)
              }];
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase?.removeChannel(channel);
    };
  }, [currentUser?.id, recipientUser?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser?.id || !recipientUser?.id) return;
    
    const tempId = Date.now().toString();
    const textToSend = newMessage;
    
    // Optimistic UI update
    setMessages(prev => [...prev, {
      id: tempId,
      senderId: currentUser.id,
      text: textToSend,
      timestamp: new Date()
    }]);
    setNewMessage('');
    
    const sent = await sendMessage(currentUser.id, recipientUser.id, textToSend);
    if (!sent) {
      // Revert if failed
      setMessages(prev => prev.filter(m => m.id !== tempId));
      console.error('Failed to send message');
    } else {
      // Replace temp with real ID
      setMessages(prev => prev.map(m => m.id === tempId ? {
        id: sent.id,
        senderId: sent.sender_id,
        text: sent.content,
        timestamp: new Date(sent.created_at)
      } : m));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isMinimized) {
    return (
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 0,
          right: 300,
          width: 250,
          borderRadius: '12px 12px 0 0',
          cursor: 'pointer',
          zIndex: 9999,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
        }}
        onClick={() => setIsMinimized(false)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge color="success" variant="dot">
            <Avatar 
              src={recipientUser?.avatarUrl}
              sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: '0.875rem', fontWeight: 'bold' }}
            >
              {!recipientUser?.avatarUrl && (recipientUser?.name?.charAt(0).toUpperCase() || 'U')}
            </Avatar>
          </Badge>
          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ maxWidth: 120 }}>
            {recipientUser?.name || 'User'}
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: 'inherit' }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
          <XIcon size={18} />
        </IconButton>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 80,
        width: 320,
        height: 450,
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        overflow: 'hidden',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.15)',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 1.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.1) : 'primary.main',
          color: theme.palette.mode === 'dark' ? 'text.primary' : 'primary.contrastText',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Badge 
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            color="success"
            sx={{ '& .MuiBadge-badge': { border: '2px solid', borderColor: 'primary.main' } }}
          >
            <Avatar 
              src={recipientUser?.avatarUrl}
              sx={{ width: 32, height: 32, bgcolor: theme.palette.mode === 'dark' ? 'primary.main' : 'background.paper', color: theme.palette.mode === 'dark' ? 'white' : 'primary.main', fontWeight: 'bold' }}
            >
              {!recipientUser?.avatarUrl && (recipientUser?.name?.charAt(0).toUpperCase() || 'U')}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              {recipientUser?.name || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>
              Active now
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" sx={{ color: 'inherit' }} onClick={() => setIsMinimized(true)}>
            <MinusIcon size={18} />
          </IconButton>
          <IconButton size="small" sx={{ color: 'inherit' }} onClick={onClose}>
            <XIcon size={18} />
          </IconButton>
        </Box>
      </Box>

      <Box 
        sx={{ 
          flex: 1, 
          p: 2, 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          bgcolor: alpha(theme.palette.background.default, 0.5)
        }}
      >
        {isRecipientConnectedToMe === false && (
          <Box sx={{ 
            p: 1.5, 
            bgcolor: alpha(theme.palette.error.main, 0.1), 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: alpha(theme.palette.error.main, 0.3),
            mb: 1
          }}>
            <Typography variant="body2" color="error.main" fontWeight={700} textAlign="center" sx={{ lineHeight: 1.4 }}>
              {recipientUser?.name ? recipientUser.name.charAt(0).toUpperCase() + recipientUser.name.slice(1) : 'This user'} is not connected to you, so your message will not be received.
            </Typography>
          </Box>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === (currentUser?.id || 'me');
          return (
            <Box 
              key={msg.id} 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}
            >
              <Box 
                sx={{ 
                  maxWidth: '80%',
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: isMe ? 'primary.main' : 'background.paper',
                  color: isMe ? 'primary.contrastText' : 'text.primary',
                  border: isMe ? 'none' : '1px solid',
                  borderColor: 'divider',
                  borderBottomRightRadius: isMe ? 4 : 12,
                  borderBottomLeftRadius: isMe ? 12 : 4,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}
              >
                <Typography variant="body2" sx={{ wordBreak: 'break-word', fontWeight: 500 }}>
                  {msg.text}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 0.5, fontSize: '0.65rem' }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <TextField
          fullWidth
          size="small"
          placeholder={isRecipientConnectedToMe === false ? "Cannot send message..." : "Write a message..."}
          variant="outlined"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isRecipientConnectedToMe === false}
          multiline
          maxRows={3}
          sx={{ 
            '& .MuiOutlinedInput-root': { 
              borderRadius: 4,
              bgcolor: alpha(theme.palette.action.hover, 0.5),
              px: 1.5,
              py: 1
            }
          }}
          InputProps={{
            endAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" sx={{ color: 'text.secondary' }} disabled={isRecipientConnectedToMe === false}>
                  <SmileIcon size={18} />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isRecipientConnectedToMe === false}
                  sx={{ 
                    bgcolor: newMessage.trim() ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                  }}
                >
                  <SendIcon size={16} />
                </IconButton>
              </Box>
            )
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 1, px: 0.5 }}>
          <IconButton size="small" sx={{ color: 'text.secondary', p: 0.5 }}>
            <ImageIcon size={16} />
          </IconButton>
          <IconButton size="small" sx={{ color: 'text.secondary', p: 0.5 }}>
            <PaperclipIcon size={16} />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
