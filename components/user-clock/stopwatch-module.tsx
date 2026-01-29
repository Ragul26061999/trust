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
    ListItemSecondaryAction,
    IconButton,
    Chip
} from '@mui/material';
import { 
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    Delete as DeleteIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';
import { formatDuration } from '../../lib/timezone-utils';

const StopwatchModule = () => {
    const { user } = useAuth();
    const { 
        stopwatch, 
        addStopwatchEntry,
        timezone,
        formatWithTz
    } = useTimeEngine();
    
    const [isRunning, setIsRunning] = useState(false);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [heading, setHeading] = useState('');
    const [purpose, setPurpose] = useState('');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setCurrentTime(new Date());
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const handleStart = () => {
        if (!heading.trim()) return;
        setStartTime(new Date());
        setIsRunning(true);
    };

    const handleStop = async () => {
        if (!startTime || !isRunning) return;
        
        const endTime = new Date();
        const startLocalIso = startTime.toISOString();
        const endLocalIso = endTime.toISOString();
        
        await addStopwatchEntry({
            heading: heading.trim(),
            purpose: purpose.trim(),
            startLocalIso,
            endLocalIso
        });
        
        setIsRunning(false);
        setStartTime(null);
        setHeading('');
        setPurpose('');
    };

    const formatElapsedTime = () => {
        if (!startTime) return '00:00:00';
        const elapsed = currentTime.getTime() - startTime.getTime();
        return formatDuration(elapsed);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Stopwatch Control Panel */}
                <Card className="shadow-lg">
                    <CardContent>
                        <Typography variant="h5" className="mb-6 text-center font-bold text-gray-800">
                            Task Stopwatch
                        </Typography>
                        
                        <Box className="mb-6">
                            <TextField
                                fullWidth
                                label="Task Heading"
                                value={heading}
                                onChange={(e) => setHeading(e.target.value)}
                                variant="outlined"
                                className="mb-4"
                                disabled={isRunning}
                            />
                            
                            <TextField
                                fullWidth
                                label="Purpose/Description"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                variant="outlined"
                                multiline
                                rows={3}
                                disabled={isRunning}
                            />
                        </Box>

                        {/* Stopwatch Display */}
                        <Box className="text-center mb-6">
                            <div className="text-4xl font-mono font-bold text-blue-600 mb-4">
                                {formatElapsedTime()}
                            </div>
                            <Chip 
                                label={isRunning ? "Recording..." : "Ready"} 
                                color={isRunning ? "success" : "default"}
                                variant="outlined"
                            />
                        </Box>

                        {/* Control Buttons */}
                        <Box className="flex justify-center gap-4">
                            {!isRunning ? (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<PlayIcon />}
                                    onClick={handleStart}
                                    disabled={!heading.trim() || isRunning}
                                    size="large"
                                >
                                    Start
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<StopIcon />}
                                    onClick={handleStop}
                                    size="large"
                                >
                                    Stop & Save
                                </Button>
                            )}
                        </Box>
                    </CardContent>
                </Card>

                {/* Session History */}
                <Card className="shadow-lg">
                    <CardContent>
                        <Typography variant="h5" className="mb-6 text-center font-bold text-gray-800">
                            Session History
                        </Typography>
                        
                        {stopwatch.length === 0 ? (
                            <Box className="text-center py-8">
                                <TimeIcon className="text-gray-400 text-4xl mb-2" />
                                <Typography variant="body1" className="text-gray-500">
                                    No sessions recorded yet
                                </Typography>
                            </Box>
                        ) : (
                            <List>
                                {stopwatch.slice(0, 10).map((session) => (
                                    <ListItem key={session.id} className="border-b border-gray-100">
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" className="font-medium">
                                                    {session.heading}
                                                </Typography>
                                            }
                                            secondary={
                                                <div>
                                                    <Typography variant="body2" className="text-gray-600">
                                                        {session.purpose}
                                                    </Typography>
                                                    <Typography variant="caption" className="text-gray-500">
                                                        {formatWithTz(session.startUtc, 'MMM d, yyyy HH:mm')} - 
                                                        Duration: {formatDuration(session.durationMs)}
                                                    </Typography>
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
        </div>
    );
};

export default StopwatchModule;