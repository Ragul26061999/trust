'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    Rating,
    IconButton,
    Paper,
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 24,
        padding: theme.spacing(2),
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
}));

interface TaskFeedbackDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (feedback: string, rating: number) => void;
    taskTitle: string;
}

const TaskFeedbackDialog: React.FC<TaskFeedbackDialogProps> = ({ open, onClose, onSubmit, taskTitle }) => {
    const [feedback, setFeedback] = useState('');
    const [rating, setRating] = useState<number | null>(5);

    const handleSubmit = () => {
        onSubmit(feedback, rating || 5);
        setFeedback('');
        onClose();
    };

    return (
        <StyledDialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}
                    >
                        <CheckCircleIcon sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Task Completed!</Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ borderRadius: '12px' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ py: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Excellent work! How would you rate your performance for:
                        <Box component="span" sx={{ display: 'block', fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
                            "{taskTitle}"
                        </Box>
                    </Typography>

                    <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Rating
                            value={rating}
                            onChange={(event, newValue) => setRating(newValue)}
                            size="large"
                            sx={{
                                fontSize: '3rem',
                                '& .MuiRating-iconFilled': {
                                    color: '#f59e0b',
                                },
                            }}
                        />
                        <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary', fontWeight: 500 }}>
                            {rating === 5 ? 'Masterful' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : 'Could be better'}
                        </Typography>
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Any reflections or notes on this task?"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '16px',
                                backgroundColor: 'rgba(0,0,0,0.02)',
                            }
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    sx={{
                        borderRadius: '16px',
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        }
                    }}
                >
                    Save Reflection
                </Button>
            </DialogActions>
        </StyledDialog>
    );
};

export default TaskFeedbackDialog;
