"use client";

import React, { useState, useEffect } from 'react';
import { useTimeEngine } from '../../lib/time-engine';
import { 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Button,
    Typography,
    Card,
    CardContent,
    Box
} from '@mui/material';
import { Save as SaveIcon, Update as UpdateIcon } from '@mui/icons-material';

const TimezoneControl = () => {
    const { 
        timezone, 
        timezoneOptions, 
        setTimezone,
        formatWithTz
    } = useTimeEngine();
    
    const [selectedTimezone, setSelectedTimezone] = useState(timezone);
    const [isSaving, setIsSaving] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleTimezoneChange = (event: any) => {
        setSelectedTimezone(event.target.value);
    };

    const handleSaveTimezone = async () => {
        if (selectedTimezone === timezone) return;
        
        setIsSaving(true);
        try {
            await setTimezone(selectedTimezone);
        } catch (error) {
            console.error('Error saving timezone:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
                <CardContent>
                    <Typography variant="h5" className="mb-6 text-center font-bold text-gray-800">
                        Timezone Control
                    </Typography>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Timezone Selector */}
                        <Box className="bg-gray-50 p-6 rounded-lg">
                            <Typography variant="h6" className="mb-4 text-gray-700">
                                Select Timezone
                            </Typography>
                            
                            <FormControl fullWidth className="mb-4">
                                <InputLabel>Timezone</InputLabel>
                                <Select
                                    value={selectedTimezone}
                                    onChange={handleTimezoneChange}
                                    label="Timezone"
                                >
                                    {timezoneOptions.map((tz) => (
                                        <MenuItem key={tz.value} value={tz.value}>
                                            {tz.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={isSaving ? <UpdateIcon /> : <SaveIcon />}
                                onClick={handleSaveTimezone}
                                disabled={isSaving || selectedTimezone === timezone}
                                fullWidth
                            >
                                {isSaving ? 'Saving...' : 'Save Timezone'}
                            </Button>
                        </Box>

                        {/* Current Time Display */}
                        <Box className="bg-blue-50 p-6 rounded-lg">
                            <Typography variant="h6" className="mb-4 text-gray-700">
                                Current Time
                            </Typography>
                            
                            <div className="text-center">
                                <div className="text-3xl font-mono font-bold text-blue-600 mb-2">
                                    {formatWithTz(currentTime, 'HH:mm:ss')}
                                </div>
                                <div className="text-lg text-gray-600">
                                    {formatWithTz(currentTime, 'EEEE, MMMM d, yyyy')}
                                </div>
                                <div className="mt-4 p-3 bg-white rounded border">
                                    <Typography variant="body2" className="text-gray-500">
                                        Timezone: {timezone}
                                    </Typography>
                                </div>
                            </div>
                        </Box>
                    </div>

                    {/* Project-wide Impact Notice */}
                    <Box className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Typography variant="body1" className="text-yellow-800">
                            <strong>Important:</strong> Changing the timezone will affect all time displays 
                            throughout the project, including personal tasks, professional tasks, and notes.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </div>
    );
};

export default TimezoneControl;