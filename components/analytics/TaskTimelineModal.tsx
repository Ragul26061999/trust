import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography, Box,
  useTheme, alpha, Chip, Divider
} from '@mui/material';
import { X, CheckCircle2, Clock, Calendar, AlertCircle, Edit3, Trash2 } from 'lucide-react';
import { TaskHistoryEntry } from '../../lib/analytics-db';
import { format, parseISO } from 'date-fns';

interface TaskTimelineModalProps {
  open: boolean;
  onClose: () => void;
  history: TaskHistoryEntry[];
  taskTitle: string;
}

const getActionDetails = (action: TaskHistoryEntry['action']) => {
  switch (action) {
    case 'created':
      return { icon: <Edit3 size={16} />, color: '#3b82f6', label: 'Created' };
    case 'completed':
      return { icon: <CheckCircle2 size={16} />, color: '#10b981', label: 'Completed' };
    case 'rescheduled':
      return { icon: <Calendar size={16} />, color: '#f59e0b', label: 'Rescheduled' };
    case 'priority_changed':
      return { icon: <AlertCircle size={16} />, color: '#ef4444', label: 'Priority Changed' };
    case 'status_changed':
      return { icon: <Clock size={16} />, color: '#8b5cf6', label: 'Status Changed' };
    case 'deleted':
      return { icon: <Trash2 size={16} />, color: '#64748b', label: 'Deleted' };
    default:
      return { icon: <Clock size={16} />, color: '#64748b', label: 'Updated' };
  }
};

export const TaskTimelineModal: React.FC<TaskTimelineModalProps> = ({ open, onClose, history, taskTitle }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: isDark ? alpha('#1e293b', 0.95) : alpha('#ffffff', 0.95),
          backdropFilter: 'blur(16px)',
          backgroundImage: 'none',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.1rem' }}>
            Task Lifecycle
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={600} noWrap sx={{ maxWidth: 350 }}>
            {taskTitle}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: alpha(theme.palette.text.primary, 0.05) }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {history.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No history available for this task.</Typography>
          </Box>
        ) : (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((entry, idx) => {
              const details = getActionDetails(entry.action);
              const isLast = idx === history.length - 1;
              
              return (
                <Box key={entry.id} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                  {/* Timeline Line */}
                  {!isLast && (
                    <Box sx={{
                      position: 'absolute', left: 19, top: 40, bottom: -10,
                      width: 2, bgcolor: isDark ? '#334155' : '#e2e8f0', zIndex: 0
                    }} />
                  )}
                  
                  {/* Icon */}
                  <Box sx={{
                    width: 40, height: 40, borderRadius: '50%',
                    bgcolor: alpha(details.color, 0.15), color: details.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, zIndex: 1
                  }}>
                    {details.icon}
                  </Box>

                  {/* Content */}
                  <Box sx={{ pb: 3, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body1" fontWeight={700} sx={{ color: details.color }}>
                        {details.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {format(parseISO(entry.created_at), 'MMM d, h:mm a')}
                      </Typography>
                    </Box>
                    
                    {/* Render specific changes based on action */}
                    {entry.action === 'rescheduled' && entry.new_value?.date && (
                      <Typography variant="body2" sx={{ bgcolor: alpha(details.color, 0.05), p: 1, borderRadius: 2 }}>
                        Moved to <Box component="span" fontWeight={700}>{format(parseISO(entry.new_value.date), 'MMMM d, yyyy')}</Box>
                      </Typography>
                    )}
                    {entry.action === 'priority_changed' && entry.new_value?.priority && (
                      <Typography variant="body2" sx={{ bgcolor: alpha(details.color, 0.05), p: 1, borderRadius: 2 }}>
                        Priority set to <Box component="span" fontWeight={700}>{entry.new_value.priority}</Box>
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
