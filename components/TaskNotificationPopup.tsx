'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Slide,
    Fade,
    Chip,
    Avatar,
    Divider,
    CircularProgress,
} from '@mui/material';
import {
    NotificationsActive as NotificationIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    EventBusy as RescheduleIcon,
    AccessTime as TimeIcon,
    Assignment as TaskIcon,
    Work as WorkIcon,
    ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useTimeEngine, AlarmEntry } from '../lib/time-engine';
import { getSuggestedFreeSlots } from '../lib/task-logic-service';
import { useAuth } from '../lib/auth-context';
import { updateTaskFeedback } from '../lib/personal-calendar-db';
import { updateProfessionalTaskFeedback } from '../lib/professional-db';
import TaskFeedbackDialog from './TaskFeedbackDialog';
import { format, parseISO } from 'date-fns';

const NotificationCard = styled(Paper)(({ theme }) => ({
    position: 'fixed',
    top: 24,
    right: 24,
    width: 380,
    zIndex: 9999,
    padding: theme.spacing(2.5),
    borderRadius: 24,
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

const TaskNotificationPopup = () => {
    const { alarms, updateAlarmStatus } = useTimeEngine();
    const { user } = useAuth();
    const [activeAlarm, setActiveAlarm] = useState<AlarmEntry | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    
    useEffect(() => {
        // Find alarm that should be triggering now (within 1 minute buffer)
        const now = new Date();
        const trigger = alarms.find(a => 
            a.status === 'Active' && 
            new Date(a.triggerUtc) <= now &&
            new Date(a.triggerUtc) >= new Date(now.getTime() - 60000 * 5) // Last 5 mins
        );
        
        if (trigger && !activeAlarm) {
            setActiveAlarm(trigger);
            // Play a notification sound if needed
            // try { new Audio('/notification.mp3').play(); } catch(e) {}
        }
    }, [alarms, activeAlarm]);

    const handleDismiss = () => {
        if (activeAlarm) {
             updateAlarmStatus(activeAlarm.id, 'Disabled');
        }
        setActiveAlarm(null);
        setShowSuggestions(false);
    };

    const handleComplete = () => {
        setShowFeedback(true);
    };

    const handleFeedbackSubmit = async (feedback: string, rating: number) => {
        if (!activeAlarm || !user) return;
        
        const fullFeedback = `Rating: ${rating}/5\n${feedback}`;
        
        try {
            if (activeAlarm.source === 'Personal Task') {
                await updateTaskFeedback(activeAlarm.id, fullFeedback);
            } else if (activeAlarm.source === 'Professional Task') {
                await updateProfessionalTaskFeedback(activeAlarm.id, fullFeedback);
            }
            
            updateAlarmStatus(activeAlarm.id, 'Completed');
            setActiveAlarm(null);
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    const handleRescheduleClick = async () => {
        if (!user) return;
        setShowSuggestions(true);
        setLoadingSuggestions(true);
        try {
            const slots = await getSuggestedFreeSlots(user.id, new Date());
            setSuggestions(slots);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSelectSuggestion = (isoDate: string) => {
        if (!activeAlarm) return;
        updateAlarmStatus(activeAlarm.id, 'Snoozed', isoDate);
        setActiveAlarm(null);
        setShowSuggestions(false);
        // In a real app, you'd also update the original task's date in DB here
        // For simplicity, we assume the alarm links to the task
    };

    if (!activeAlarm) return null;

    return (
        <>
            <Slide direction="left" in={!!activeAlarm} mountOnEnter unmountOnExit>
                <NotificationCard elevation={0}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                                sx={{
                                    bgcolor: activeAlarm.source === 'Professional Task' ? '#FF9800' : '#14b8a6',
                                    width: 44,
                                    height: 44,
                                    boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)',
                                }}
                            >
                                {activeAlarm.source === 'Professional Task' ? <WorkIcon /> : <TaskIcon />}
                            </Avatar>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 0.2 }}>
                                    {activeAlarm.source}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'text.primary' }}>
                                    {activeAlarm.title}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={handleDismiss} size="small" sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'rgba(0,0,0,0.05)', color: 'error.main' } }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', bgcolor: 'rgba(0,0,0,0.03)', px: 1.5, py: 1, borderRadius: '12px' }}>
                        <TimeIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Due at {format(parseISO(activeAlarm.triggerUtc), 'hh:mm a')}
                        </Typography>
                    </Box>

                    {!showSuggestions ? (
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<CheckCircleIcon />}
                                onClick={handleComplete}
                                sx={{
                                    borderRadius: '14px',
                                    py: 1.2,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    boxShadow: '0 10px 20px -8px rgba(16, 185, 129, 0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                    }
                                }}
                            >
                                Complete
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<RescheduleIcon />}
                                onClick={handleRescheduleClick}
                                sx={{
                                    borderRadius: '14px',
                                    py: 1.2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderColor: 'rgba(0,0,0,0.1)',
                                    color: 'text.primary',
                                    '&:hover': {
                                        borderColor: 'text.primary',
                                        bgcolor: 'rgba(0,0,0,0.02)',
                                    }
                                }}
                            >
                                Delay
                            </Button>
                        </Box>
                    ) : (
                        <Fade in={showSuggestions}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    Smart Suggestions based on your free time:
                                </Typography>
                                {loadingSuggestions ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : suggestions.length > 0 ? (
                                    suggestions.map((slot, idx) => (
                                        <Button
                                            key={idx}
                                            variant="text"
                                            fullWidth
                                            onClick={() => handleSelectSuggestion(slot)}
                                            sx={{
                                                justifyContent: 'space-between',
                                                borderRadius: '12px',
                                                bgcolor: 'rgba(0,0,0,0.02)',
                                                px: 2,
                                                py: 1.2,
                                                color: 'text.primary',
                                                '&:hover': { bgcolor: 'primary.main', color: 'white' }
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {format(parseISO(slot), 'hh:mm a')}
                                            </Typography>
                                            <ArrowIcon sx={{ fontSize: 16 }} />
                                        </Button>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">No free slots found today.</Typography>
                                )}
                                <Button size="small" onClick={() => setShowSuggestions(false)} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>
                                    Back
                                </Button>
                            </Box>
                        </Fade>
                    )}
                </NotificationCard>
            </Slide>

            <TaskFeedbackDialog
                open={showFeedback}
                onClose={() => setShowFeedback(false)}
                onSubmit={handleFeedbackSubmit}
                taskTitle={activeAlarm.title}
            />
        </>
    );
};

export default TaskNotificationPopup;
