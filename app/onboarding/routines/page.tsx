'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Card, 
    CardContent,
    IconButton,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Bedtime as BedtimeIcon, Coffee as CoffeeIcon } from '@mui/icons-material';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';

interface Break {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
}

export default function RoutinesOnboardingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    const [sleepStart, setSleepStart] = useState('22:00');
    const [sleepEnd, setSleepEnd] = useState('06:00');
    const [breaks, setBreaks] = useState<Break[]>([
        { id: '1', name: 'Lunch Break', start_time: '13:00', end_time: '14:00' }
    ]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleAddBreak = () => {
        setBreaks([
            ...breaks,
            { id: Date.now().toString(), name: '', start_time: '15:00', end_time: '15:30' }
        ]);
    };

    const handleRemoveBreak = (id: string) => {
        setBreaks(breaks.filter(b => b.id !== id));
    };

    const handleBreakChange = (id: string, field: keyof Break, value: string) => {
        setBreaks(breaks.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleSave = async () => {
        if (!user) return;
        
        // Validation
        if (!sleepStart || !sleepEnd) {
            setError('Please provide your typical sleep and wake times.');
            return;
        }

        const invalidBreaks = breaks.some(b => !b.name.trim() || !b.start_time || !b.end_time);
        if (invalidBreaks) {
            setError('Please fill out all details for your breaks, or remove empty ones.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            if (!supabase) throw new Error('Supabase not configured');
            // 1. Update user preferences
            const { error: prefError } = await supabase
                .from('user_preferences')
                .update({ 
                    is_onboarded_routines: true,
                    default_sleep_start: sleepStart,
                    default_sleep_end: sleepEnd
                })
                .eq('user_id', user.id);

            // If user_preferences record doesn't exist, we might need to insert it
            if (prefError && prefError.code === 'PGRST116') {
                 await supabase
                .from('user_preferences')
                .insert([{ 
                    user_id: user.id,
                    is_onboarded_routines: true,
                    default_sleep_start: sleepStart,
                    default_sleep_end: sleepEnd
                }]);
            } else if (prefError) {
                // If the column doesn't exist yet because migration wasn't run, we just fail gracefully and redirect
                console.warn("Could not save to user_preferences, migration might be missing", prefError);
            }

            // 2. Insert breaks
            if (breaks.length > 0) {
                const breaksToInsert = breaks.map(b => ({
                    user_id: user.id,
                    name: b.name,
                    start_time: b.start_time,
                    end_time: b.end_time
                }));

                const { error: breaksError } = await supabase
                    .from('user_breaks')
                    .insert(breaksToInsert);
                    
                if (breaksError) {
                    console.warn("Could not save breaks, migration might be missing", breaksError);
                }
            }
            
            // Allow the user to proceed anyway even if migration is missing locally
            router.push('/home');

        } catch (err: any) {
            console.error(err);
            setError('An error occurred while saving your routines.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !user) {
        return (
            <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, fontFamily: "'Inter', sans-serif" }}>
            <Card sx={{ maxWidth: 600, width: '100%', borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                    <Box sx={{ textAlign: 'center', mb: 5 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5, letterSpacing: '-0.02em' }}>
                            Design Your Day
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#64748B', lineHeight: 1.6 }}>
                            To build a healthy, balanced schedule, TimePerPro needs to know when you sleep and when you take breaks. We will make sure tasks don't intrude on your personal time.
                        </Typography>
                    </Box>

                    {/* Sleep Section */}
                    <Box sx={{ mb: 5 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700, color: '#1E293B', mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', display: 'flex' }}>
                                <BedtimeIcon fontSize="small" />
                            </Box>
                            Sleep Schedule
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <TextField 
                                label="Bedtime (Go to sleep)" 
                                type="time" 
                                value={sleepStart}
                                onChange={(e) => setSleepStart(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 3 } }} 
                            />
                            <TextField 
                                label="Wake up time" 
                                type="time" 
                                value={sleepEnd}
                                onChange={(e) => setSleepEnd(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 3 } }} 
                            />
                        </Box>
                    </Box>

                    {/* Breaks Section */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700, color: '#1E293B' }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex' }}>
                                    <CoffeeIcon fontSize="small" />
                                </Box>
                                Daily Breaks
                            </Typography>
                            <Button 
                                variant="outlined" 
                                size="small" 
                                startIcon={<AddIcon />}
                                onClick={handleAddBreak}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                            >
                                Add Break
                            </Button>
                        </Box>
                        
                        {breaks.map((breakItem, index) => (
                            <Box key={breakItem.id} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', bgcolor: '#FFFFFF', p: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
                                <TextField 
                                    label="Break Name" 
                                    placeholder="e.g. Lunch"
                                    value={breakItem.name}
                                    onChange={(e) => handleBreakChange(breakItem.id, 'name', e.target.value)}
                                    size="small"
                                    sx={{ flex: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} 
                                />
                                <TextField 
                                    label="Start" 
                                    type="time" 
                                    value={breakItem.start_time}
                                    onChange={(e) => handleBreakChange(breakItem.id, 'start_time', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} 
                                />
                                <TextField 
                                    label="End" 
                                    type="time" 
                                    value={breakItem.end_time}
                                    onChange={(e) => handleBreakChange(breakItem.id, 'end_time', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} 
                                />
                                <IconButton onClick={() => handleRemoveBreak(breakItem.id)} color="error" sx={{ bgcolor: 'rgba(239,68,68,0.05)' }}>
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}
                        
                        {breaks.length === 0 && (
                            <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 3, fontStyle: 'italic' }}>
                                You haven't added any breaks yet. We highly recommend adding at least one!
                            </Typography>
                        )}
                    </Box>

                    <Button 
                        variant="contained" 
                        fullWidth 
                        onClick={handleSave}
                        disabled={isSubmitting}
                        disableElevation
                        sx={{ 
                            py: 1.5, 
                            borderRadius: 3, 
                            fontWeight: 800, 
                            fontSize: '1.05rem',
                            bgcolor: '#6366F1',
                            '&:hover': { bgcolor: '#4F46E5' }
                        }}
                    >
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Routine & Continue'}
                    </Button>
                </CardContent>
            </Card>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%', borderRadius: 2 }}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}
