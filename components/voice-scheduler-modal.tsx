'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog, DialogContent, Box, Typography, IconButton,
  TextField, Chip, CircularProgress, alpha, LinearProgress, Button
} from '@mui/material';
import {
  Mic as MicIcon, Stop as StopIcon, CheckCircle as CheckIcon,
  Close as CloseIcon, Phone as PhoneIcon
} from '@mui/icons-material';
import { addCalendarEntry } from '../lib/personal-calendar-db';
import { addProfessionalTask } from '../lib/professional-db';
import { addNote } from '../lib/notes-db';

interface VoiceSchedulerModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

type Step = 'welcome' | 'type' | 'title' | 'date' | 'description' | 'confirm' | 'saving' | 'done';

interface ConversationMessage {
  from: 'ai' | 'user';
  text: string;
}

const STEPS: Step[] = ['type', 'title', 'date', 'description', 'confirm'];

const STEP_QUESTIONS: Record<string, string> = {
  type: 'Hello! Is this a Personal task, Professional task, or a Note? Please say Personal, Professional, or Note.',
  title: 'Great! What would you like to title this? Please say the title now.',
  date: 'Got it! When would you like to schedule this? You can say Today, Tomorrow, or a specific date like May 25th.',
  description: 'Perfect! Please describe the task or add any additional details.',
  confirm: 'All done! Shall I save this now? Say Yes to confirm or No to start over.',
};

function speak(text: string, onEnd?: () => void) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  utterance.volume = 1;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

function parseDate(text: string): string {
  const lower = text.toLowerCase();
  const d = new Date();
  if (lower.includes('tomorrow')) d.setDate(d.getDate() + 1);
  else if (lower.includes('next week')) d.setDate(d.getDate() + 7);
  else if (lower.includes('day after')) d.setDate(d.getDate() + 2);
  // Try to parse month + number e.g. "May 25"
  const monthMatch = lower.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/);
  if (monthMatch) {
    const months: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    d.setMonth(months[monthMatch[1]]);
    d.setDate(parseInt(monthMatch[2]));
  }
  return d.toISOString().split('T')[0];
}

function parseType(text: string): 'personal' | 'professional' | 'note' {
  const lower = text.toLowerCase();
  if (lower.includes('professional') || lower.includes('work')) return 'professional';
  if (lower.includes('note') || lower.includes('remember')) return 'note';
  return 'personal';
}

const TYPE_COLOR: Record<string, string> = {
  personal: '#9C27B0',
  professional: '#FF9800',
  note: '#6750A4',
};

export const VoiceSchedulerModal: React.FC<VoiceSchedulerModalProps> = ({ open, onClose, userId, onSuccess }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [textInput, setTextInput] = useState('');

  // Form data
  const [type, setType] = useState<'personal' | 'professional' | 'note'>('personal');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll conversation
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [conversation]);

  // Init speech recognition
  useEffect(() => {
    // @ts-ignore
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      const t = e.results[e.resultIndex][0].transcript;
      setLiveTranscript(t);
    };
    rec.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error);
      if (e.error === 'network') {
        setErrorMessage('Network error: Browser blocked speech API (common in Brave). Please use the text input below.');
      } else {
        setErrorMessage(`Microphone error: ${e.error}. Please use the text input below.`);
      }
      setIsListening(false);
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    
    // Pre-load voices
    window.speechSynthesis.getVoices();
  }, []);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep('welcome');
      setConversation([]);
      setType('personal');
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setLiveTranscript('');
      setErrorMessage('');
    } else {
      window.speechSynthesis.cancel();
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    }
  }, [open]);

  const startAssistant = () => {
    // Unlock audio context by speaking an empty string
    const unlockMsg = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(unlockMsg);

    setStep('type');
    const q = STEP_QUESTIONS['type'];
    setIsSpeaking(true);
    setConversation([{ from: 'ai', text: q }]);
    speak(q, () => setIsSpeaking(false));
  };

  const addMsg = (from: 'ai' | 'user', text: string) => {
    setConversation(prev => [...prev, { from, text }]);
  };

  const askNext = useCallback((nextStep: Step, userAnswer: string) => {
    // Add user message
    addMsg('user', userAnswer);
    setLiveTranscript('');

    if (nextStep === 'done') return;

    const q = STEP_QUESTIONS[nextStep] ?? '';
    setStep(nextStep);
    setIsSpeaking(true);

    // Slight delay then speak
    setTimeout(() => {
      addMsg('ai', q);
      speak(q, () => setIsSpeaking(false));
    }, 400);
  }, []);

  const handleAnswer = useCallback((answer: string) => {
    if (!answer.trim()) return;
    const lower = answer.toLowerCase();

    if (step === 'type') {
      const t = parseType(answer);
      setType(t);
      const nextStep = 'title';
      askNext(nextStep, answer);
    } else if (step === 'title') {
      setTitle(answer);
      // Skip date for notes
      const nextStep = type === 'note' ? 'description' : 'date';
      askNext(nextStep, answer);
    } else if (step === 'date') {
      setDate(parseDate(answer));
      askNext('description', answer);
    } else if (step === 'description') {
      setDescription(answer);
      // Build confirm message
      const confirmText = `Perfect! Here's a summary: Type is ${type}, Title is ${title}, ${type !== 'note' ? `Date is ${parseDate(answer !== description ? date : date)},` : ''} Description: ${answer}. Say Yes to save or No to cancel.`;
      addMsg('user', answer);
      setLiveTranscript('');
      setStep('confirm');
      setIsSpeaking(true);
      setTimeout(() => {
        addMsg('ai', confirmText);
        speak(confirmText, () => setIsSpeaking(false));
      }, 400);
    } else if (step === 'confirm') {
      addMsg('user', answer);
      setLiveTranscript('');
      if (lower.includes('yes') || lower.includes('yeah') || lower.includes('save') || lower.includes('confirm') || lower.includes('ok')) {
        handleSave();
      } else {
        const msg = 'No problem! Let\'s start over.';
        addMsg('ai', msg);
        speak(msg, () => {
          setStep('type');
          setTitle(''); setDescription(''); setDate(new Date().toISOString().split('T')[0]);
          setType('personal');
          const q = STEP_QUESTIONS['type'];
          setTimeout(() => { addMsg('ai', q); speak(q); }, 600);
        });
      }
    }
  }, [step, type, title, date, description, askNext]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const answer = textInput;
    setTextInput('');
    handleAnswer(answer);
  };

  const handleSave = async () => {
    setStep('saving');
    setIsProcessing(true);
    const savingMsg = 'Saving your schedule now...';
    addMsg('ai', savingMsg);
    speak(savingMsg);
    try {
      if (type === 'personal') {
        await addCalendarEntry({ user_id: userId, title, description, category: 'task', entry_date: new Date(`${date}T12:00:00`).toISOString(), status: 'pending' });
      } else if (type === 'professional') {
        await addProfessionalTask({ user_id: userId, title, description, task_date: date, status: 'pending' });
      } else {
        await addNote({ user_id: userId, title, content: description });
      }
      setStep('done');
      const doneMsg = `Done! Your ${type} "${title}" has been scheduled successfully. Have a great day!`;
      addMsg('ai', doneMsg);
      speak(doneMsg, () => {
        setTimeout(() => { onSuccess(); onClose(); }, 1500);
      });
    } catch (e) {
      const errMsg = 'Sorry, something went wrong. Please try again.';
      addMsg('ai', errMsg);
      speak(errMsg);
      setStep('confirm');
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
    setErrorMessage('');
    setLiveTranscript('');
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (e) {
      console.error('Failed to start recording:', e);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    if (liveTranscript) handleAnswer(liveTranscript);
  };

  const stepIndex = STEPS.indexOf(step);
  const progress = step === 'done' ? 100 : step === 'saving' ? 90 : stepIndex >= 0 ? (stepIndex / (STEPS.length - 1)) * 80 : 0;

  const typeColor = TYPE_COLOR[type] || '#4CAF50';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.07)',
        }
      }}
    >
      {/* Header */}
      <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '50%',
            bgcolor: alpha('#4CAF50', 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid', borderColor: alpha('#4CAF50', 0.3)
          }}>
            <PhoneIcon sx={{ color: '#4CAF50', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#f8fafc', fontWeight: 700, lineHeight: 1 }}>Voice Scheduler</Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>AI Assistant</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {type && step !== 'type' && (
            <Chip label={type} size="small" sx={{ bgcolor: alpha(typeColor, 0.15), color: typeColor, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${alpha(typeColor, 0.3)}` }} />
          )}
          <IconButton onClick={onClose} size="small" sx={{ color: '#64748b', '&:hover': { color: '#f8fafc' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Progress */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 3,
          bgcolor: 'rgba(255,255,255,0.05)',
          '& .MuiLinearProgress-bar': {
            background: `linear-gradient(90deg, #4CAF50, ${typeColor})`,
            borderRadius: 2,
          }
        }}
      />

      <DialogContent sx={{ p: 0 }}>
        {step === 'welcome' && (
          <Box sx={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: alpha('#4CAF50', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <PhoneIcon sx={{ color: '#4CAF50', fontSize: 32 }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#f8fafc', mb: 1 }}>AI Voice Scheduler</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 4, px: 2 }}>
              I will guide you step by step to schedule your task. Make sure your microphone permissions are enabled.
            </Typography>
            <Button 
              variant="contained" 
              onClick={startAssistant}
              startIcon={<PhoneIcon />}
              sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' }, px: 4, py: 1.5, borderRadius: 8, textTransform: 'none', fontWeight: 'bold' }}
            >
              Start Conversation
            </Button>
          </Box>
        )}

        {/* Conversation Area */}
        {step !== 'welcome' && (
          <Box
            ref={scrollRef}
          sx={{
            height: 280,
            overflowY: 'auto',
            px: 2.5,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
          }}
        >
          {conversation.map((msg, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                justifyContent: msg.from === 'ai' ? 'flex-start' : 'flex-end',
                alignItems: 'flex-end',
                gap: 1,
              }}
            >
              {msg.from === 'ai' && (
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  bgcolor: alpha('#4CAF50', 0.2), border: '1px solid', borderColor: alpha('#4CAF50', 0.3),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5
                }}>
                  <PhoneIcon sx={{ color: '#4CAF50', fontSize: 13 }} />
                </Box>
              )}
              <Box sx={{
                maxWidth: '78%',
                px: 2, py: 1.2,
                borderRadius: msg.from === 'ai' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                bgcolor: msg.from === 'ai' ? 'rgba(255,255,255,0.06)' : alpha(typeColor, 0.15),
                border: '1px solid',
                borderColor: msg.from === 'ai' ? 'rgba(255,255,255,0.08)' : alpha(typeColor, 0.25),
              }}>
                <Typography variant="body2" sx={{ color: msg.from === 'ai' ? '#cbd5e1' : '#f8fafc', lineHeight: 1.5, fontSize: '0.82rem' }}>
                  {msg.text}
                </Typography>
              </Box>
            </Box>
          ))}

          {/* AI speaking indicator */}
          {isSpeaking && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha('#4CAF50', 0.2), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PhoneIcon sx={{ color: '#4CAF50', fontSize: 13 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center', px: 2, py: 1, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '4px 16px 16px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {[0, 1, 2].map(j => (
                  <Box key={j} sx={{
                    width: 6, height: 6, borderRadius: '50%', bgcolor: '#4CAF50',
                    animation: 'bounce 1s infinite',
                    animationDelay: `${j * 0.2}s`,
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'scaleY(0.4)' },
                      '50%': { transform: 'scaleY(1.4)' },
                    }
                  }} />
                ))}
              </Box>
            </Box>
          )}

          {/* Live transcript bubble */}
          {isListening && liveTranscript && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{
                maxWidth: '78%', px: 2, py: 1.2,
                borderRadius: '16px 4px 16px 16px',
                bgcolor: alpha(typeColor, 0.08),
                border: `1px dashed ${alpha(typeColor, 0.4)}`,
              }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  {liveTranscript}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
        )}

        {/* Filled fields summary */}
        {(title || description) && step !== 'type' && (
          <Box sx={{ mx: 2.5, mb: 1.5, p: 1.5, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)' }}>
            {title && (
              <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', minWidth: 70 }}>Title:</Typography>
                <Typography variant="caption" sx={{ color: '#e2e8f0', fontWeight: 600 }}>{title}</Typography>
              </Box>
            )}
            {type !== 'note' && step !== 'title' && (
              <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', minWidth: 70 }}>Date:</Typography>
                <Typography variant="caption" sx={{ color: '#e2e8f0', fontWeight: 600 }}>{date}</Typography>
              </Box>
            )}
            {description && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', minWidth: 70 }}>Details:</Typography>
                <Typography variant="caption" sx={{ color: '#e2e8f0' }} noWrap>{description}</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Microphone area */}
        {step !== 'welcome' && (
          <Box sx={{ px: 2.5, pb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            {errorMessage && (
              <Typography variant="caption" sx={{ color: '#f44336', bgcolor: alpha('#f44336', 0.1), px: 2, py: 0.5, borderRadius: 1 }}>
                {errorMessage}
              </Typography>
            )}
            
            {step !== 'saving' && step !== 'done' && (
            <>
              <Box
                onClick={isListening ? stopListening : startListening}
                sx={{
                  width: 56, height: 56, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: isListening ? alpha('#f44336', 0.15) : alpha('#4CAF50', 0.12),
                  border: `2px solid`,
                  borderColor: isListening ? '#f44336' : alpha('#4CAF50', 0.4),
                  boxShadow: isListening ? '0 0 0 8px rgba(244,67,54,0.08), 0 0 20px rgba(244,67,54,0.25)' : '0 0 10px rgba(76,175,80,0.15)',
                  transition: 'all 0.3s ease',
                  animation: isListening ? 'ripple 1.4s infinite' : 'none',
                  '@keyframes ripple': {
                    '0%': { boxShadow: '0 0 0 0 rgba(244,67,54,0.4)' },
                    '70%': { boxShadow: '0 0 0 12px rgba(244,67,54,0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(244,67,54,0)' },
                  },
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                {isListening
                  ? <StopIcon sx={{ color: '#f44336', fontSize: 24 }} />
                  : <MicIcon sx={{ color: '#4CAF50', fontSize: 24 }} />
                }
              </Box>
              
              <Box component="form" onSubmit={handleTextSubmit} sx={{ display: 'flex', width: '100%', gap: 1 }}>
                <TextField 
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Or type your answer here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 6,
                      color: '#f8fafc',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&.Mui-focused fieldset': { borderColor: '#4CAF50' }
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={!textInput.trim()}
                  sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' }, minWidth: 0, px: 2, borderRadius: 6 }}
                >
                  Send
                </Button>
              </Box>
              <Typography variant="caption" sx={{ color: isListening ? '#f87171' : '#64748b', fontWeight: 500, letterSpacing: '0.04em' }}>
                {isListening ? '● LISTENING — Tap to stop' : 'Tap mic to speak, or type above'}
              </Typography>
            </>
          )}

          {step === 'saving' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 1 }}>
              <CircularProgress size={44} thickness={3} sx={{ color: '#4CAF50' }} />
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Saving your schedule...</Typography>
            </Box>
          )}

            {step === 'done' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 1 }}>
                <CheckIcon sx={{ color: '#4CAF50', fontSize: 48 }} />
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>Saved Successfully!</Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceSchedulerModal;
