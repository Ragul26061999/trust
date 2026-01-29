"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Fade,
  FormControl,
  Grid as Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
  Stack,
  Paper,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AlarmIcon from "@mui/icons-material/Alarm";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import PublicIcon from "@mui/icons-material/Public";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DoneIcon from "@mui/icons-material/Done";
import SnoozeIcon from "@mui/icons-material/Snooze";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Bell,
  Clock,
  Globe,
  Timer,
  Moon,
  Plus,
  Filter,
  Calendar,
  TrendingUp,
  Target,
  Zap,
  Sparkles,
} from 'lucide-react';

// Create icon wrapper components for Lucide icons to work with MUI
const LucideIcon = ({ icon: Icon, size = 20, sx, ...props }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'center', ...sx }} {...props}>
    <Icon size={size} />
  </Box>
);

import ProtectedLayout from "../protected-layout";
import { useAuth } from "../../lib/auth-context";
import { TimeEngineProvider, useTimeEngine } from "../../lib/time-engine";
import { formatInUserTimezone, getCurrentUserTimezone } from "../../lib/timezone-utils";

type TabKey = "timezone" | "stopwatch" | "bedtime" | "alarm";
type AlarmSource = "Personal Task" | "Professional Task" | "Note" | "Custom";
type AlarmFormState = {
  title: string;
  source: AlarmSource;
  trigger: string;
  link: string;
};

const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

const UserClockPageContent = () => {
  const { logout } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const {
    timezone,
    timezoneOptions,
    setTimezone,
    formatWithTz,
    stopwatch,
    addStopwatchEntry,
    bedtime,
    addBedtimeEntry,
    alarms,
    addAlarm,
    updateAlarmStatus,
    deleteAlarm,
  } = useTimeEngine();

  const [tab, setTab] = useState<TabKey>("timezone");
  const [timezoneDraft, setTimezoneDraft] = useState<string>(timezone);

  useEffect(() => {
    setTimezoneDraft(timezone);
  }, [timezone]);

  const [stopwatchForm, setStopwatchForm] = useState({
    heading: "",
    purpose: "",
    start: "",
    end: "",
  });
  const [stopwatchFilters, setStopwatchFilters] = useState({ date: "", purpose: "" });

  const [bedtimeForm, setBedtimeForm] = useState({ sleep: "", wake: "" });

  const [alarmForm, setAlarmForm] = useState<AlarmFormState>({
    title: "",
    source: "Custom",
    trigger: "",
    link: "",
  });

  const handleLogout = () => logout();
  const handleGoBack = () => router.back();

  const filteredStopwatch = useMemo(() => {
    return stopwatch.filter((entry) => {
      const matchesPurpose = stopwatchFilters.purpose
        ? entry.purpose.toLowerCase().includes(stopwatchFilters.purpose.toLowerCase()) ||
          entry.heading.toLowerCase().includes(stopwatchFilters.purpose.toLowerCase())
        : true;

      const matchesDate = stopwatchFilters.date
        ? formatWithTz(entry.startUtc, "yyyy-MM-dd") === stopwatchFilters.date ||
          formatWithTz(entry.endUtc, "yyyy-MM-dd") === stopwatchFilters.date
        : true;

      return matchesPurpose && matchesDate;
    });
  }, [stopwatch, stopwatchFilters, formatWithTz]);

  const weeklySleepAverage = useMemo(() => {
    if (!bedtime.length) return null;
    const total = bedtime.reduce((acc, b) => acc + b.durationMs, 0);
    return total / bedtime.length;
  }, [bedtime]);

  const handleTimezoneSave = async () => {
    if (!timezoneDraft) return;
    await setTimezone(timezoneDraft);
  };

  const handleStopwatchSubmit = () => {
    if (!stopwatchForm.heading || !stopwatchForm.purpose || !stopwatchForm.start || !stopwatchForm.end) return;
    addStopwatchEntry({
      heading: stopwatchForm.heading,
      purpose: stopwatchForm.purpose,
      startLocalIso: stopwatchForm.start,
      endLocalIso: stopwatchForm.end,
    });
    setStopwatchForm({ heading: "", purpose: "", start: "", end: "" });
  };

  const handleBedtimeSubmit = () => {
    if (!bedtimeForm.sleep || !bedtimeForm.wake) return;
    addBedtimeEntry({ sleepLocalIso: bedtimeForm.sleep, wakeLocalIso: bedtimeForm.wake });
    setBedtimeForm({ sleep: "", wake: "" });
  };

  const handleAlarmSubmit = () => {
    if (!alarmForm.title || !alarmForm.trigger) return;
    addAlarm({
      title: alarmForm.title,
      source: alarmForm.source,
      triggerLocalIso: alarmForm.trigger,
      link: alarmForm.link || undefined,
    });
    setAlarmForm({ title: "", source: "Custom", trigger: "", link: "" });
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <Toolbar>
          <IconButton 
            edge="start" 
            onClick={handleGoBack} 
            aria-label="back"
            sx={{ 
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'action.hover',
                borderRadius: 2
              }
            }}
          >
            <LucideIcon icon={ArrowBackIcon} size={24} />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LucideIcon icon={Clock} size={20} sx={{ color: 'white' }} />
            </Box>
            <Box>
              <Typography 
                variant="h4" 
                component="div" 
                sx={{ 
                  fontWeight: 800, 
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.2
                }}
              >
                Time Control Center
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Manage your timezone, stopwatch, bedtime, and alarms
              </Typography>
            </Box>
          </Box>
          <Button 
            color="inherit" 
            onClick={handleLogout} 
            sx={{ 
              textTransform: "none",
              borderRadius: 3,
              px: 3,
              py: 1,
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Fade in timeout={350}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800, 
                mb: 2,
                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Unified Time System
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              Timezone, Stopwatch, Bedtime, and Alarms are controlled from here. Changes sync across Dashboard, Tasks, Notes, and more.
            </Typography>
          </Box>

        <Box sx={{ 
          mb: 4,
          bgcolor: 'background.paper',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          p: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
          }
        }}>
          <Tabs 
            value={tab} 
            variant="scrollable"
            scrollButtons="auto"
            onChange={(_, v) => setTab(v)}
            sx={{
              '& .MuiTabs-indicator': {
                display: 'none'
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: 'text.secondary',
                minHeight: 56,
                px: 3,
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid transparent',
                '&:hover': {
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                },
                '&.Mui-selected': {
                  color: '#2196F3',
                  bgcolor: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%)',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  boxShadow: '0 4px 20px rgba(33, 150, 243, 0.15)',
                  transform: 'translateY(-2px)',
                  '& .MuiSvgIcon-root': {
                    color: '#2196F3'
                  }
                }
              }
            }}
          >
            <Tab 
              value="timezone" 
              icon={<LucideIcon icon={Globe} size={18} />} 
              iconPosition="start" 
              label="Timezone" 
            />
            <Tab 
              value="stopwatch" 
              icon={<LucideIcon icon={Timer} size={18} />} 
              iconPosition="start" 
              label="Stopwatch" 
            />
            <Tab 
              value="bedtime" 
              icon={<LucideIcon icon={Moon} size={18} />} 
              iconPosition="start" 
              label="Bedtime" 
            />
            <Tab 
              value="alarm" 
              icon={<LucideIcon icon={AlarmIcon} size={18} />} 
              iconPosition="start" 
              label="Alarm" 
            />
          </Tabs>
        </Box>

          <Box>
            {tab === "timezone" && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                          }}
                        >
                          <LucideIcon icon={Globe} size={24} sx={{ color: 'white' }} />
                        </Box>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            Global Timezone
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            All modules read from this timezone
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Stack spacing={3}>
                        <FormControl 
                          fullWidth 
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                              bgcolor: 'background.paper',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                borderColor: '#2196F3'
                              },
                              '&:focus-within': {
                                boxShadow: '0 8px 30px rgba(33, 150, 243, 0.15)',
                                borderColor: '#2196F3'
                              }
                            }
                          }}
                        >
                          <InputLabel>Timezone</InputLabel>
                          <Select
                            label="Timezone"
                            value={timezoneDraft}
                            onChange={(e) => setTimezoneDraft(e.target.value)}
                          >
                            {timezoneOptions.map((tz) => (
                              <MenuItem key={tz.value} value={tz.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <LucideIcon icon={Globe} size={16} sx={{ color: '#2196F3' }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{tz.label}</Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <Button 
                            variant="contained" 
                            onClick={handleTimezoneSave}
                            sx={{ 
                              borderRadius: 3,
                              py: 1.5,
                              px: 3,
                              fontWeight: 700,
                              textTransform: 'none',
                              boxShadow: '0 4px 20px rgba(33, 150, 243, 0.3)',
                              '&:hover': {
                                boxShadow: '0 8px 30px rgba(33, 150, 243, 0.4)',
                                transform: 'translateY(-2px)'
                              }
                            }}
                            startIcon={<LucideIcon icon={Target} size={20} />}
                          >
                            Set Timezone
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              const detected = getCurrentUserTimezone();
                              setTimezoneDraft(detected);
                              setTimezone(detected);
                            }}
                            sx={{ 
                              borderRadius: 3,
                              py: 1.5,
                              px: 3,
                              fontWeight: 700,
                              textTransform: 'none',
                              borderColor: 'divider',
                              '&:hover': {
                                borderColor: '#2196F3',
                                bgcolor: 'rgba(33, 150, 243, 0.04)'
                              }
                            }}
                            startIcon={<LucideIcon icon={Zap} size={20} />}
                          >
                            Detect & Apply
                          </Button>
                        </Stack>
                        
                        <Chip 
                          label={`Current: ${timezone}`} 
                          color="primary" 
                          variant="filled" 
                          sx={{ 
                            borderRadius: 2,
                            fontWeight: 700,
                            py: 1,
                            px: 2
                          }}
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                          }}
                        >
                          <LucideIcon icon={Sparkles} size={24} sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          Architecture
                        </Typography>
                      </Box>
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        Global Time Engine → Stored in context + local storage → Persists to DB (user preferences) → Consumed by
                        Dashboard, Tasks, Notes, Alarms, Stopwatch, Bedtime.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {tab === "stopwatch" && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                          }}
                        >
                          <LucideIcon icon={Timer} size={24} sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          Create Stopwatch Entry
                        </Typography>
                      </Box>
                      
                      <Stack spacing={3}>
                        <TextField
                          label="Heading"
                          value={stopwatchForm.heading}
                          onChange={(e) => setStopwatchForm((p) => ({ ...p, heading: e.target.value }))}
                          fullWidth
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        />
                        <TextField
                          label="Purpose"
                          value={stopwatchForm.purpose}
                          onChange={(e) => setStopwatchForm((p) => ({ ...p, purpose: e.target.value }))}
                          fullWidth
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        />
                        <TextField
                          type="datetime-local"
                          label="Start"
                          InputLabelProps={{ shrink: true }}
                          value={stopwatchForm.start}
                          onChange={(e) => setStopwatchForm((p) => ({ ...p, start: e.target.value }))}
                          fullWidth
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        />
                        <TextField
                          type="datetime-local"
                          label="End"
                          InputLabelProps={{ shrink: true }}
                          value={stopwatchForm.end}
                          onChange={(e) => setStopwatchForm((p) => ({ ...p, end: e.target.value }))}
                          fullWidth
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        />
                        <Button 
                          variant="contained" 
                          onClick={handleStopwatchSubmit} 
                          startIcon={<LucideIcon icon={Timer} size={20} />}
                          sx={{ 
                            borderRadius: 3,
                            py: 1.5,
                            px: 3,
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)',
                            '&:hover': {
                              boxShadow: '0 8px 30px rgba(76, 175, 80, 0.4)',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          Start Tracking
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                          }}
                        >
                          <LucideIcon icon={Filter} size={24} sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          Stopwatch History
                        </Typography>
                      </Box>
                      
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                        <TextField
                          size="small"
                          label="Filter by date"
                          type="date"
                          InputLabelProps={{ shrink: true }}
                          value={stopwatchFilters.date}
                          onChange={(e) => setStopwatchFilters((p) => ({ ...p, date: e.target.value }))}
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        />
                        <TextField
                          size="small"
                          label="Filter by purpose"
                          value={stopwatchFilters.purpose}
                          onChange={(e) => setStopwatchFilters((p) => ({ ...p, purpose: e.target.value }))}
                          sx={{ 
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        />
                      </Stack>

                      <Stack spacing={2}>
                        {filteredStopwatch.map((entry) => (
                          <Card 
                            key={entry.id} 
                            variant="outlined" 
                            sx={{ 
                              p: 2,
                              borderRadius: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                borderColor: '#4CAF50',
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                  {entry.heading}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {entry.purpose}
                                </Typography>
                              </Box>
                              <Chip 
                                label={formatDuration(entry.durationMs)} 
                                color="success" 
                                variant="filled" 
                                sx={{ 
                                  fontWeight: 700,
                                  borderRadius: 2
                                }}
                              />
                            </Stack>

                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', gap: 3 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  Start ({timezone})
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                                  {formatWithTz(entry.startUtc, "PPpp")}
                                </Typography>
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  End ({timezone})
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                                  {formatWithTz(entry.endUtc, "PPpp")}
                                </Typography>
                              </Box>
                            </Box>
                          </Card>
                        ))}

                        {!filteredStopwatch.length && (
                          <Box sx={{ textAlign: 'center', py: 5 }}>
                            <LucideIcon icon={Timer} size={48} sx={{ color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                              No stopwatch entries yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Start tracking your time activities
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {tab === "bedtime" && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                          }}
                        >
                          <LucideIcon icon={Moon} size={24} sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          Log Sleep
                        </Typography>
                      </Box>
                      
                      <Stack spacing={3}>
                        <TextField
                          type="datetime-local"
                          label="Sleep time"
                          InputLabelProps={{ shrink: true }}
                          value={bedtimeForm.sleep}
                          onChange={(e) => setBedtimeForm((p) => ({ ...p, sleep: e.target.value }))}
                          fullWidth
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        />
                        <TextField
                          type="datetime-local"
                          label="Wake-up time"
                          InputLabelProps={{ shrink: true }}
                          value={bedtimeForm.wake}
                          onChange={(e) => setBedtimeForm((p) => ({ ...p, wake: e.target.value }))}
                          fullWidth
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        />
                        <Button 
                          variant="contained" 
                          onClick={handleBedtimeSubmit} 
                          startIcon={<LucideIcon icon={Moon} size={20} />}
                          sx={{ 
                            borderRadius: 3,
                            py: 1.5,
                            px: 3,
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: '0 4px 20px rgba(156, 39, 176, 0.3)',
                            '&:hover': {
                              boxShadow: '0 8px 30px rgba(156, 39, 176, 0.4)',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          Save Sleep
                        </Button>
                      </Stack>

                      {weeklySleepAverage !== null && (
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            mt: 3,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'rgba(156, 39, 176, 0.05)'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <LucideIcon icon={TrendingUp} size={20} sx={{ color: '#9C27B0', mr: 1 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#9C27B0' }}>
                              Avg Sleep Duration
                            </Typography>
                          </Box>
                          <Typography variant="h4" sx={{ fontWeight: 800, color: '#9C27B0', mb: 1 }}>
                            {formatDuration(weeklySleepAverage)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Across {bedtime.length} logs
                          </Typography>
                        </Card>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                          }}
                        >
                          <LucideIcon icon={Calendar} size={24} sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          Sleep History
                        </Typography>
                      </Box>
                      
                      <Stack spacing={2}>
                        {bedtime.map((entry) => (
                          <Card 
                            key={entry.id} 
                            variant="outlined" 
                            sx={{ 
                              p: 2,
                              borderRadius: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                borderColor: '#9C27B0',
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {entry.dateLabel}
                              </Typography>
                              <Chip 
                                label={formatDuration(entry.durationMs)} 
                                color="secondary" 
                                sx={{ 
                                  fontWeight: 700,
                                  borderRadius: 2
                                }}
                              />
                            </Stack>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', gap: 3 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  Sleep ({timezone})
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                                  {formatWithTz(entry.sleepUtc, "PPpp")}
                                </Typography>
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  Wake ({timezone})
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                                  {formatWithTz(entry.wakeUtc, "PPpp")}
                                </Typography>
                              </Box>
                            </Box>
                          </Card>
                        ))}

                        {!bedtime.length && (
                          <Box sx={{ textAlign: 'center', py: 5 }}>
                            <LucideIcon icon={Moon} size={48} sx={{ color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                              No sleep logs yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Start logging your sleep patterns
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {tab === "alarm" && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                          }}
                        >
                          <LucideIcon icon={AlarmIcon} size={24} sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          Create Alarm
                        </Typography>
                      </Box>
                      
                      <Stack spacing={3}>
                        <TextField
                          label="Title"
                          value={alarmForm.title}
                          onChange={(e) => setAlarmForm((p) => ({ ...p, title: e.target.value }))}
                          fullWidth
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        />
                        <FormControl 
                          fullWidth 
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        >
                          <InputLabel>Source</InputLabel>
                          <Select
                            label="Source"
                            value={alarmForm.source}
                            onChange={(e) => setAlarmForm((p) => ({ ...p, source: e.target.value as AlarmSource }))}
                          >
                            <MenuItem value="Personal Task">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <LucideIcon icon={AccessTimeIcon} size={16} sx={{ color: '#4CAF50' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Personal Task</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="Professional Task">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <LucideIcon icon={AccessTimeIcon} size={16} sx={{ color: '#2196F3' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Professional Task</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="Note">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <LucideIcon icon={AccessTimeIcon} size={16} sx={{ color: '#FF9800' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Note</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value="Custom">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <LucideIcon icon={Plus} size={16} sx={{ color: '#9C27B0' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Custom</Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          type="datetime-local"
                          label="Trigger time"
                          InputLabelProps={{ shrink: true }}
                          value={alarmForm.trigger}
                          onChange={(e) => setAlarmForm((p) => ({ ...p, trigger: e.target.value }))}
                          fullWidth
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        />
                        <TextField
                          label="Link to source (optional)"
                          value={alarmForm.link}
                          onChange={(e) => setAlarmForm((p) => ({ ...p, link: e.target.value }))}
                          fullWidth
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3
                            }
                          }}
                        />
                        <Button 
                          variant="contained" 
                          onClick={handleAlarmSubmit} 
                          startIcon={<LucideIcon icon={AlarmIcon} size={20} />}
                          sx={{ 
                            borderRadius: 3,
                            py: 1.5,
                            px: 3,
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: '0 4px 20px rgba(244, 67, 54, 0.3)',
                            '&:hover': {
                              boxShadow: '0 8px 30px rgba(244, 67, 54, 0.4)',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          Save Alarm
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box 
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #FF5722 0%, #E64A19 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2
                          }}
                        >
                          <LucideIcon icon={Bell} size={24} sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          Alarm Management
                        </Typography>
                      </Box>
                      
                      <Stack spacing={2}>
                        {alarms.map((alarm) => (
                          <Card 
                            key={alarm.id} 
                            variant="outlined" 
                            sx={{ 
                              p: 2,
                              borderRadius: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                borderColor: '#F44336',
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                                  {alarm.title}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  <Chip 
                                    size="small" 
                                    label={alarm.source} 
                                    sx={{ 
                                      borderRadius: 2,
                                      fontWeight: 600
                                    }}
                                  />
                                  <Chip 
                                    size="small" 
                                    label={alarm.status} 
                                    color={alarm.status === "Active" ? "success" : "default"}
                                    sx={{ 
                                      borderRadius: 2,
                                      fontWeight: 600
                                    }}
                                  />
                                  {alarm.link && (
                                    <Chip
                                      size="small"
                                      component="a"
                                      href={alarm.link}
                                      clickable
                                      label="Open source"
                                      target="_blank"
                                      rel="noreferrer"
                                      sx={{ 
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        bgcolor: 'rgba(33, 150, 243, 0.1)',
                                        color: '#2196F3'
                                      }}
                                    />
                                  )}
                                </Stack>
                              </Box>
                              <Chip
                                color="primary"
                                label={formatInUserTimezone(alarm.triggerUtc, "PPpp", timezone)}
                                variant="filled"
                                sx={{ 
                                  fontWeight: 700,
                                  borderRadius: 2
                                }}
                              />
                            </Stack>

                            <Divider sx={{ my: 2 }} />
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<LucideIcon icon={RestartAltIcon} size={16} />}
                                onClick={() => updateAlarmStatus(alarm.id, "Active")}
                                sx={{ 
                                  borderRadius: 2,
                                  fontWeight: 600,
                                  textTransform: 'none'
                                }}
                              >
                                Activate
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<LucideIcon icon={SnoozeIcon} size={16} />}
                                onClick={() => {
                                  const newTime = prompt("Snooze to new datetime (local)", alarmForm.trigger);
                                  if (newTime) updateAlarmStatus(alarm.id, "Snoozed", newTime);
                                }}
                                sx={{ 
                                  borderRadius: 2,
                                  fontWeight: 600,
                                  textTransform: 'none'
                                }}
                              >
                                Snooze
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<LucideIcon icon={DoneIcon} size={16} />}
                                onClick={() => updateAlarmStatus(alarm.id, "Completed")}
                                sx={{ 
                                  borderRadius: 2,
                                  fontWeight: 600,
                                  textTransform: 'none'
                                }}
                              >
                                Complete
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<LucideIcon icon={DeleteOutlineIcon} size={16} />}
                                onClick={() => deleteAlarm(alarm.id)}
                                sx={{ 
                                  borderRadius: 2,
                                  fontWeight: 600,
                                  textTransform: 'none'
                                }}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </Card>
                        ))}

                        {!alarms.length && (
                          <Box sx={{ textAlign: 'center', py: 5 }}>
                            <LucideIcon icon={Bell} size={48} sx={{ color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                              No alarms registered yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Create your first alarm reminder
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Container>
      </Fade>
    </Box>
  );
};

export default function UserClockPage() {
  return (
    <ProtectedLayout>
      <TimeEngineProvider>
        <UserClockPageContent />
      </TimeEngineProvider>
    </ProtectedLayout>
  );
}