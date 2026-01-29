"use client";

import React, { useState, useEffect } from 'react';
import { useTimeEngine } from '../../lib/time-engine';
import { useAuth } from '../../lib/auth-context';
import { 
    TextField, 
    Button, 
    Typography, 
    Card, 
    CardContent, 
    Box,
    List,
    ListItem,
    ListItemText,
    Paper
} from '@mui/material';
import { 
    Bedtime as BedtimeIcon,
    WbSunny as WakeIcon,
    BarChart as StatsIcon
} from '@mui/icons-material';
import { formatDuration } from '../../lib/timezone-utils';

const BedtimeModule = () => {
    const { user } = useAuth();
    const { 
        bedtime, 
        addBedtimeEntry,
        timezone,
        formatWithTz
    } = useTimeEngine();
    
    const [sleepTime, setSleepTime] = useState('');
    const [wakeTime, setWakeTime] = useState('');
    const [notes, setNotes] = useState('');
    const [stats, setStats] = useState({
        averageDuration: 0,
        averageSleepTime: '00:00',
        averageWakeTime: '00:00',
        consistencyScore: 0
    });

    useEffect(() => {
        // Load bedtime stats when component mounts
        loadBedtimeStats();
    }, [bedtime]);

    const loadBedtimeStats = async () => {
        // This would call the bedtime service to get stats
        // For now, we'll calculate basic stats from local data
        if (bedtime.length > 0) {
            const totalDuration = bedtime.reduce((sum, log) => sum + log.durationMs, 0);
            const avgDuration = totalDuration / bedtime.length;
            
            setStats({
                averageDuration: avgDuration,
                averageSleepTime: '22:30', // Placeholder
                averageWakeTime: '06:30',  // Placeholder
                consistencyScore: 85       // Placeholder
            });
        }
    };

    const handleLogBedtime = async () => {
        if (!sleepTime || !wakeTime) return;
        
        const sleepDate = new Date(sleepTime);
        const wakeDate = new Date(wakeTime);
        
        if (wakeDate <= sleepDate) {
            wakeDate.setDate(wakeDate.getDate() + 1);
        }
        
        await addBedtimeEntry({
            sleepLocalIso: sleepDate.toISOString(),
            wakeLocalIso: wakeDate.toISOString(),
            notes: notes || undefined
        });
        
        setSleepTime('');
        setWakeTime('');
        setNotes('');
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Logging Panel */}
                <div className="lg:col-span-2">
                    <Card className="shadow-lg mb-8">
                        <CardContent>
                            <Typography variant="h5" className="mb-6 text-center font-bold text-gray-800">
                                Log Sleep Time
                            </Typography>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <TextField
                                        fullWidth
                                        label="Sleep Time"
                                        type="datetime-local"
                                        value={sleepTime}
                                        onChange={(e) => setSleepTime(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        variant="outlined"
                                    />
                                </div>
                                <div>
                                    <TextField
                                        fullWidth
                                        label="Wake Time"
                                        type="datetime-local"
                                        value={wakeTime}
                                        onChange={(e) => setWakeTime(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        variant="outlined"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <TextField
                                        fullWidth
                                        label="Notes (Optional)"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        variant="outlined"
                                        multiline
                                        rows={2}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleLogBedtime}
                                        disabled={!sleepTime || !wakeTime}
                                        fullWidth
                                        size="large"
                                    >
                                        Log Sleep Session
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* History */}
                    <Card className="shadow-lg">
                        <CardContent>
                            <Typography variant="h5" className="mb-6 text-center font-bold text-gray-800">
                                Sleep History
                            </Typography>
                            
                            {bedtime.length === 0 ? (
                                <Box className="text-center py-8">
                                    <BedtimeIcon className="text-gray-400 text-4xl mb-2" />
                                    <Typography variant="body1" className="text-gray-500">
                                        No sleep logs recorded yet
                                    </Typography>
                                </Box>
                            ) : (
                                <List>
                                    {bedtime.slice(0, 15).map((log) => (
                                        <ListItem key={log.id} className="border-b border-gray-100">
                                            <ListItemText
                                                primary={
                                                    <div className="flex items-center gap-2">
                                                        <BedtimeIcon className="text-blue-500" />
                                                        <span className="font-medium">
                                                            {formatWithTz(log.sleepUtc, 'MMM d, yyyy')}
                                                        </span>
                                                    </div>
                                                }
                                                secondary={
                                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                                        <div>
                                                            <Typography variant="caption" className="text-gray-500">
                                                                Sleep: {formatWithTz(log.sleepUtc, 'HH:mm')}
                                                            </Typography>
                                                        </div>
                                                        <div>
                                                            <Typography variant="caption" className="text-gray-500">
                                                                Wake: {formatWithTz(log.wakeUtc, 'HH:mm')}
                                                            </Typography>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <Typography variant="body2" className="font-medium">
                                                                Duration: {formatDuration(log.durationMs)}
                                                            </Typography>
                                                        </div>
                                                        {log.notes && (
                                                            <div className="col-span-2">
                                                                <Typography variant="caption" className="text-gray-600">
                                                                    Notes: {log.notes}
                                                                </Typography>
                                                            </div>
                                                        )}
                                                    </div>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Statistics Panel */}
                <div>
                    <Card className="shadow-lg sticky top-8">
                        <CardContent>
                            <Typography variant="h5" className="mb-6 text-center font-bold text-gray-800">
                                <StatsIcon className="mr-2" />
                                Sleep Statistics
                            </Typography>
                            
                            <div className="space-y-6">
                                <Box className="text-center p-4 bg-blue-50 rounded-lg">
                                    <Typography variant="h4" className="font-bold text-blue-600">
                                        {formatDuration(stats.averageDuration)}
                                    </Typography>
                                    <Typography variant="body2" className="text-gray-600">
                                        Average Duration
                                    </Typography>
                                </Box>
                                
                                <Box className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div className="flex items-center">
                                            <BedtimeIcon className="text-indigo-500 mr-2" />
                                            <Typography variant="body2">Avg Sleep Time</Typography>
                                        </div>
                                        <Typography variant="body1" className="font-medium">
                                            {stats.averageSleepTime}
                                        </Typography>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <div className="flex items-center">
                                            <WakeIcon className="text-yellow-500 mr-2" />
                                            <Typography variant="body2">Avg Wake Time</Typography>
                                        </div>
                                        <Typography variant="body1" className="font-medium">
                                            {stats.averageWakeTime}
                                        </Typography>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <Typography variant="body2">Consistency Score</Typography>
                                        <Typography 
                                            variant="body1" 
                                            className={`font-bold ${
                                                stats.consistencyScore >= 80 ? 'text-green-600' :
                                                stats.consistencyScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                            }`}
                                        >
                                            {stats.consistencyScore}%
                                        </Typography>
                                    </div>
                                </Box>
                                
                                <Box className="p-4 bg-yellow-50 rounded-lg">
                                    <Typography variant="body2" className="text-yellow-800">
                                        <strong>Tip:</strong> Aim for 7-9 hours of sleep per night for optimal health.
                                    </Typography>
                                </Box>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BedtimeModule;