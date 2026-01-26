'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Paper, 
  Typography, 
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Mic as MicIcon,
  Square as SquareIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Trash2 as TrashIcon,
  Download as DownloadIcon
} from 'lucide-react';
import LucideIcon from './icon-wrapper';

interface AudioRecording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: string;
}

interface AudioRecorderProps {
  onRecordingComplete: (audioData: string, duration: number) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewRecording, setPreviewRecording] = useState<AudioRecording | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const recording: AudioRecording = {
          id: `recording-${Date.now()}`,
          blob: audioBlob,
          url: audioUrl,
          duration: recordingTime,
          timestamp: new Date().toISOString()
        };

        setRecordings(prev => [...prev, recording]);
        
        // Convert to base64 and pass to parent
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onRecordingComplete(base64data, recordingTime);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(rec => rec.id !== id));
  };

  const downloadRecording = (recording: AudioRecording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `recording-${recording.timestamp}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Audio Recording
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Recording Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {!isRecording ? (
          <Button
            variant="contained"
            color="error"
            startIcon={<MicIcon />}
            onClick={startRecording}
            disabled={recordings.length >= 5} // Limit to 5 recordings
          >
            Start Recording
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              color="error"
              startIcon={<SquareIcon />}
              onClick={stopRecording}
            >
              Stop
            </Button>
            {!isPaused ? (
              <Button
                variant="outlined"
                startIcon={<PauseIcon />}
                onClick={pauseRecording}
              >
                Pause
              </Button>
            ) : (
              <Button
                variant="outlined"
                startIcon={<PlayIcon />}
                onClick={resumeRecording}
              >
                Resume
              </Button>
            )}
          </>
        )}

        {isRecording && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" color="error.main">
              {formatTime(recordingTime)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'error.main',
                  animation: 'pulse 1s infinite'
                }} 
              />
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'error.main',
                  animation: 'pulse 1s infinite 0.2s'
                }} 
              />
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'error.main',
                  animation: 'pulse 1s infinite 0.4s'
                }} 
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Recordings List */}
      {recordings.length > 0 && (
        <List dense>
          {recordings.map((recording) => (
            <ListItem key={recording.id} sx={{ border: '1px solid #eee', mb: 1, borderRadius: 1 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Audio Recording
                    </Typography>
                    <audio controls style={{ width: 200 }}>
                      <source src={recording.url} type="audio/wav" />
                    </audio>
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Duration: {formatTime(recording.duration)} • 
                    {new Date(recording.timestamp).toLocaleString()}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  onClick={() => downloadRecording(recording)}
                  sx={{ mr: 1 }}
                >
                  <DownloadIcon size={16} />
                </IconButton>
                <IconButton 
                  edge="end" 
                  onClick={() => deleteRecording(recording.id)}
                >
                  <TrashIcon size={16} />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </Paper>
  );
};

export default AudioRecorder;
