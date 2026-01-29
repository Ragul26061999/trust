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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Switch
} from '@mui/material';
import { 
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Notifications as AlarmIcon,
    NotificationsActive as ActiveAlarmIcon,
    NotificationsOff as DisabledAlarmIcon
} from '@mui/icons-material';
import { formatDuration } from '../../lib/timezone-utils';

const AlarmModule = () => {
    const { user } = useAuth();
    const { 
        alarms, 
        addAlarm,
        updateAlarmStatus: updateAlarmStatusLocal,
        deleteAlarm: deleteAlarmLocal,
        timezone,
        formatWithTz
    } = useTimeEngine();
    
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentAlarm, setCurrentAlarm] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [source, setSource] = useState('Custom');
    const [triggerTime, setTriggerTime] = useState('');
    const [isActive, setIsActive] = useState(true);

    const sourceOptions = [
        { value: 'Custom', label: 'Custom Alarm' },
        { value: 'Personal Task', label: 'Personal Task' },
        { value: 'Professional Task', label: 'Professional Task' },
        { value: 'Note', label: 'Note Reminder' }
    ];

    const handleOpenDialog = (alarm: any = null) => {
        if (alarm) {
            setEditMode(true);
            setCurrentAlarm(alarm);
            setTitle(alarm.title);
            setSource(alarm.source);
            setTriggerTime(new Date(alarm.triggerUtc).toISOString().slice(0, 16));
            setIsActive(alarm.status === 'Active');
        } else {
            setEditMode(false);
            setCurrentAlarm(null);
            setTitle('');
            setSource('Custom');
            setTriggerTime('');
            setIsActive(true);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMode(false);
        setCurrentAlarm(null);
    };

    const handleSaveAlarm = async () => {
        if (!title.trim() || !triggerTime) return;
        
        const triggerLocalIso = new Date(triggerTime).toISOString();
        
        if (editMode && currentAlarm) {
            await updateAlarmStatusLocal(
                currentAlarm.id, 
                isActive ? 'Active' : 'Disabled',
                triggerLocalIso
            );
        } else {
            await addAlarm({
                title: title.trim(),
                source: source as any,
                triggerLocalIso: triggerLocalIso
            });
        }
        
        handleCloseDialog();
    };

    const handleDeleteAlarm = async (alarmId: string) => {
        await deleteAlarmLocal(alarmId);
    };

    const handleToggleStatus = async (alarmId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
        await updateAlarmStatusLocal(alarmId, newStatus);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Active': return <ActiveAlarmIcon className="text-green-500" />;
            case 'Disabled': return <DisabledAlarmIcon className="text-gray-400" />;
            case 'Snoozed': return <AlarmIcon className="text-yellow-500" />;
            default: return <AlarmIcon className="text-gray-400" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
                <CardContent>
                    <div className="flex justify-between items-center mb-6">
                        <Typography variant="h5" className="font-bold text-gray-800">
                            <AlarmIcon className="mr-2" />
                            Alarms & Reminders
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                        >
                            Add Alarm
                        </Button>
                    </div>

                    {alarms.length === 0 ? (
                        <Box className="text-center py-12">
                            <AlarmIcon className="text-gray-400 text-5xl mb-4" />
                            <Typography variant="h6" className="text-gray-500 mb-2">
                                No alarms set
                            </Typography>
                            <Typography variant="body2" className="text-gray-400">
                                Create your first alarm to get started
                            </Typography>
                        </Box>
                    ) : (
                        <List>
                            {alarms.map((alarm) => (
                                <ListItem key={alarm.id} className="border-b border-gray-100">
                                    <div className="flex items-center mr-4">
                                        {getStatusIcon(alarm.status)}
                                    </div>
                                    <ListItemText
                                        primary={
                                            <div className="flex items-center gap-2">
                                                <Typography variant="subtitle1" className="font-medium">
                                                    {alarm.title}
                                                </Typography>
                                                <Chip 
                                                    label={alarm.source} 
                                                    size="small" 
                                                    variant="outlined"
                                                    className="text-xs"
                                                />
                                            </div>
                                        }
                                        secondary={
                                            <div className="mt-1">
                                                <Typography variant="body2" className="text-gray-600">
                                                    {formatWithTz(alarm.triggerUtc, 'EEEE, MMMM d, yyyy HH:mm')}
                                                </Typography>
                                                <Typography variant="caption" className="text-gray-500">
                                                    Status: {alarm.status}
                                                </Typography>
                                            </div>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton 
                                            onClick={() => handleToggleStatus(alarm.id, alarm.status)}
                                            size="small"
                                            className="mr-2"
                                        >
                                            {alarm.status === 'Active' ? 
                                                <DisabledAlarmIcon /> : 
                                                <ActiveAlarmIcon />
                                            }
                                        </IconButton>
                                        <IconButton 
                                            onClick={() => handleOpenDialog(alarm)}
                                            size="small"
                                            className="mr-2"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            onClick={() => handleDeleteAlarm(alarm.id)}
                                            size="small"
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>

            {/* Alarm Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editMode ? 'Edit Alarm' : 'Create New Alarm'}
                </DialogTitle>
                <DialogContent>
                    <Box className="space-y-4 mt-2">
                        <TextField
                            fullWidth
                            label="Alarm Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            variant="outlined"
                        />
                        
                        <FormControl fullWidth>
                            <InputLabel>Source Type</InputLabel>
                            <Select
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                label="Source Type"
                            >
                                {sourceOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <TextField
                            fullWidth
                            label="Trigger Time"
                            type="datetime-local"
                            value={triggerTime}
                            onChange={(e) => setTriggerTime(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
                        />
                        
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                            }
                            label="Active Alarm"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button 
                        onClick={handleSaveAlarm} 
                        variant="contained" 
                        color="primary"
                        disabled={!title.trim() || !triggerTime}
                    >
                        {editMode ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AlarmModule;