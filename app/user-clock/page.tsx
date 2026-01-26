"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
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
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: "primary.main", borderRadius: 2, mb: 3 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleGoBack} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            User Clock – Global Time Engine
          </Typography>
          <Button color="inherit" onClick={handleLogout} sx={{ textTransform: "none" }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: "primary.main" }}>
          Unified Time System
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Timezone, Stopwatch, Bedtime, and Alarms are controlled from here. Changes sync across Dashboard, Tasks, Notes, and more.
        </Typography>

        <Paper elevation={0} sx={{ mt: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab value="timezone" icon={<PublicIcon />} iconPosition="start" label="Timezone" />
            <Tab value="stopwatch" icon={<AccessTimeIcon />} iconPosition="start" label="Stopwatch" />
            <Tab value="bedtime" icon={<BedtimeIcon />} iconPosition="start" label="Bedtime" />
            <Tab value="alarm" icon={<AlarmIcon />} iconPosition="start" label="Alarm" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tab === "timezone" && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Global Timezone
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    All modules read from this timezone. Browser defaults are ignored.
                  </Typography>

                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Timezone</InputLabel>
                      <Select
                        label="Timezone"
                        value={timezoneDraft}
                        onChange={(e) => setTimezoneDraft(e.target.value)}
                      >
                        {timezoneOptions.map((tz) => (
                          <MenuItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" onClick={handleTimezoneSave}>
                        Set Timezone
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          const detected = getCurrentUserTimezone();
                          setTimezoneDraft(detected);
                          setTimezone(detected);
                        }}
                        startIcon={<PublicIcon />}
                      >
                        Detect & Apply
                      </Button>
                    </Stack>
                    <Chip label={`Current: ${timezone}`} color="primary" variant="outlined" />
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Architecture
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Global Time Engine → Stored in context + local storage → Persists to DB (user preferences) → Consumed by
                      Dashboard, Tasks, Notes, Alarms, Stopwatch, Bedtime.
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            )}

            {tab === "stopwatch" && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Create Stopwatch Entry
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Heading"
                      value={stopwatchForm.heading}
                      onChange={(e) => setStopwatchForm((p) => ({ ...p, heading: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Purpose"
                      value={stopwatchForm.purpose}
                      onChange={(e) => setStopwatchForm((p) => ({ ...p, purpose: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      type="datetime-local"
                      label="Start"
                      InputLabelProps={{ shrink: true }}
                      value={stopwatchForm.start}
                      onChange={(e) => setStopwatchForm((p) => ({ ...p, start: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      type="datetime-local"
                      label="End"
                      InputLabelProps={{ shrink: true }}
                      value={stopwatchForm.end}
                      onChange={(e) => setStopwatchForm((p) => ({ ...p, end: e.target.value }))}
                      fullWidth
                    />
                    <Button variant="contained" onClick={handleStopwatchSubmit} startIcon={<AccessTimeIcon />}>
                      Start Tracking
                    </Button>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                    <TextField
                      size="small"
                      label="Filter by date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={stopwatchFilters.date}
                      onChange={(e) => setStopwatchFilters((p) => ({ ...p, date: e.target.value }))}
                    />
                    <TextField
                      size="small"
                      label="Filter by purpose"
                      value={stopwatchFilters.purpose}
                      onChange={(e) => setStopwatchFilters((p) => ({ ...p, purpose: e.target.value }))}
                    />
                  </Stack>

                  <Stack spacing={2}>
                    {filteredStopwatch.map((entry) => (
                      <Card key={entry.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {entry.heading}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {entry.purpose}
                            </Typography>
                          </Box>
                          <Chip label={formatDuration(entry.durationMs)} color="primary" variant="outlined" />
                        </Stack>

                        <Divider sx={{ my: 1.5 }} />
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">
                              Start ({timezone})
                            </Typography>
                            <Typography variant="body2">{formatWithTz(entry.startUtc, "PPpp")}</Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">
                              End ({timezone})
                            </Typography>
                            <Typography variant="body2">{formatWithTz(entry.endUtc, "PPpp")}</Typography>
                          </Grid>
                        </Grid>
                      </Card>
                    ))}

                    {!filteredStopwatch.length && (
                      <Typography variant="body2" color="text.secondary">
                        No stopwatch entries yet.
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            )}

            {tab === "bedtime" && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Log Sleep
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      type="datetime-local"
                      label="Sleep time"
                      InputLabelProps={{ shrink: true }}
                      value={bedtimeForm.sleep}
                      onChange={(e) => setBedtimeForm((p) => ({ ...p, sleep: e.target.value }))}
                    />
                    <TextField
                      type="datetime-local"
                      label="Wake-up time"
                      InputLabelProps={{ shrink: true }}
                      value={bedtimeForm.wake}
                      onChange={(e) => setBedtimeForm((p) => ({ ...p, wake: e.target.value }))}
                    />
                    <Button variant="contained" onClick={handleBedtimeSubmit} startIcon={<BedtimeIcon />}>
                      Save Sleep
                    </Button>
                  </Stack>

                  {weeklySleepAverage !== null && (
                    <Card variant="outlined" sx={{ p: 2, mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Avg Sleep Duration
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDuration(weeklySleepAverage)} (across {bedtime.length} logs)
                      </Typography>
                    </Card>
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack spacing={2}>
                    {bedtime.map((entry) => (
                      <Card key={entry.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {entry.dateLabel}
                          </Typography>
                          <Chip label={formatDuration(entry.durationMs)} color="primary" />
                        </Stack>
                        <Divider sx={{ my: 1.5 }} />
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">
                              Sleep ({timezone})
                            </Typography>
                            <Typography variant="body2">{formatWithTz(entry.sleepUtc, "PPpp")}</Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">
                              Wake ({timezone})
                            </Typography>
                            <Typography variant="body2">{formatWithTz(entry.wakeUtc, "PPpp")}</Typography>
                          </Grid>
                        </Grid>
                      </Card>
                    ))}

                    {!bedtime.length && (
                      <Typography variant="body2" color="text.secondary">
                        No sleep logs yet.
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            )}

            {tab === "alarm" && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Create Alarm
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Title"
                      value={alarmForm.title}
                      onChange={(e) => setAlarmForm((p) => ({ ...p, title: e.target.value }))}
                      fullWidth
                    />
                    <FormControl fullWidth size="small">
                      <InputLabel>Source</InputLabel>
                      <Select
                        label="Source"
                        value={alarmForm.source}
                        onChange={(e) => setAlarmForm((p) => ({ ...p, source: e.target.value as AlarmSource }))}
                      >
                        <MenuItem value="Personal Task">Personal Task</MenuItem>
                        <MenuItem value="Professional Task">Professional Task</MenuItem>
                        <MenuItem value="Note">Note</MenuItem>
                        <MenuItem value="Custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      type="datetime-local"
                      label="Trigger time"
                      InputLabelProps={{ shrink: true }}
                      value={alarmForm.trigger}
                      onChange={(e) => setAlarmForm((p) => ({ ...p, trigger: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Link to source (optional)"
                      value={alarmForm.link}
                      onChange={(e) => setAlarmForm((p) => ({ ...p, link: e.target.value }))}
                      fullWidth
                    />
                    <Button variant="contained" onClick={handleAlarmSubmit} startIcon={<AlarmIcon />}>
                      Save Alarm
                    </Button>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack spacing={2}>
                    {alarms.map((alarm) => (
                      <Card key={alarm.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {alarm.title}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Chip size="small" label={alarm.source} />
                              <Chip size="small" label={alarm.status} color={alarm.status === "Active" ? "success" : "default"} />
                              {alarm.link && (
                                <Chip
                                  size="small"
                                  component="a"
                                  href={alarm.link}
                                  clickable
                                  label="Open source"
                                  target="_blank"
                                  rel="noreferrer"
                                />
                              )}
                            </Stack>
                          </Box>
                          <Chip
                            color="primary"
                            label={formatInUserTimezone(alarm.triggerUtc, "PPpp", timezone)}
                            variant="outlined"
                          />
                        </Stack>

                        <Divider sx={{ my: 1.5 }} />
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<RestartAltIcon />}
                            onClick={() => updateAlarmStatus(alarm.id, "Active")}
                          >
                            Activate
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<SnoozeIcon />}
                            onClick={() => {
                              const newTime = prompt("Snooze to new datetime (local)", alarmForm.trigger);
                              if (newTime) updateAlarmStatus(alarm.id, "Snoozed", newTime);
                            }}
                          >
                            Snooze
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<DoneIcon />}
                            onClick={() => updateAlarmStatus(alarm.id, "Completed")}
                          >
                            Complete
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => deleteAlarm(alarm.id)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </Card>
                    ))}

                    {!alarms.length && (
                      <Typography variant="body2" color="text.secondary">
                        No alarms registered yet.
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>
      </Container>
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