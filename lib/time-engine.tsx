"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { differenceInMilliseconds, parseISO } from "date-fns";
import {
  convertFromUTC,
  convertToUTC,
  formatInUserTimezone,
  getCommonTimezones,
  getCurrentUserTimezone,
} from "./timezone-utils";
import { getTimezonePreference, setTimezonePreference } from "./settings-service";
import { useAuth } from "./auth-context";
import { createStopwatchSession, getStopwatchSessions } from "./stopwatch-service";
import { createBedtimeLog, getBedtimeLogs } from "./bedtime-service";
import { createAlarm, getAlarms, updateAlarmStatus, deleteAlarm } from "./alarm-service";

export type StopwatchEntry = {
  id: string;
  heading: string;
  purpose: string;
  startUtc: string; // ISO UTC
  endUtc: string; // ISO UTC
  durationMs: number;
  createdAtUtc: string;
};

export type BedtimeEntry = {
  id: string;
  sleepUtc: string;
  wakeUtc: string;
  durationMs: number;
  dateLabel: string; // e.g., 2024-05-01
  notes?: string;
};

export type AlarmEntry = {
  id: string;
  title: string;
  source: "Personal Task" | "Professional Task" | "Note" | "Custom";
  triggerUtc: string;
  status: "Active" | "Snoozed" | "Completed" | "Disabled";
  link?: string;
};

type TimeEngineState = {
  timezone: string;
  stopwatch: StopwatchEntry[];
  bedtime: BedtimeEntry[];
  alarms: AlarmEntry[];
};

type TimeEngineContextValue = {
  timezone: string;
  timezoneOptions: { value: string; label: string }[];
  setTimezone: (tz: string) => Promise<void>;
  formatWithTz: (isoOrDate: string | Date, fmt: string) => string;
  toUserDate: (isoUtc: string) => Date;
  addStopwatchEntry: (payload: {
    heading: string;
    purpose: string;
    startLocalIso: string;
    endLocalIso: string;
  }) => void;
  stopwatch: StopwatchEntry[];
  addBedtimeEntry: (payload: { sleepLocalIso: string; wakeLocalIso: string; notes?: string }) => void,
  bedtime: BedtimeEntry[];
  addAlarm: (payload: { title: string; source: AlarmEntry["source"]; triggerLocalIso: string; link?: string }) => void;
  updateAlarmStatus: (id: string, status: AlarmEntry["status"], newTriggerLocalIso?: string) => void;
  deleteAlarm: (id: string) => void;
  alarms: AlarmEntry[];
};

const STORAGE_KEY = "time-engine-state";

const TimeEngineContext = createContext<TimeEngineContextValue | null>(null);

const initialState: TimeEngineState = {
  timezone: "UTC",
  stopwatch: [],
  bedtime: [],
  alarms: [],
};

function loadState(): TimeEngineState {
  if (typeof window === "undefined") return initialState;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialState;
  try {
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ...parsed,
      stopwatch: parsed.stopwatch || [],
      bedtime: parsed.bedtime || [],
      alarms: parsed.alarms || [],
    };
  } catch {
    return initialState;
  }
}

function persistState(state: TimeEngineState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function TimeEngineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<TimeEngineState>(initialState);

  useEffect(() => {
    const stored = loadState();
    setState((prev) => ({ ...prev, ...stored }));
  }, []);

  // Load timezone preference from DB if available
  useEffect(() => {
    const loadTz = async () => {
      if (!user?.id) return;
      const saved = await getTimezonePreference(user.id);
      if (saved) {
        setState((prev) => {
          const next = { ...prev, timezone: saved };
          persistState(next);
          return next;
        });
      }
    };
    loadTz();
  }, [user?.id]);

  const timezoneOptions = useMemo(() => getCommonTimezones(), []);

  const setTimezone = useCallback(
    async (tz: string) => {
      setState((prev) => {
        const next = { ...prev, timezone: tz };
        persistState(next);
        return next;
      });
      if (user?.id) {
        await setTimezonePreference(user.id, tz);
      }
    },
    [user?.id]
  );

  const formatWithTz = useCallback(
    (isoOrDate: string | Date, fmt: string) => formatInUserTimezone(isoOrDate, fmt, state.timezone),
    [state.timezone]
  );

  const toUserDate = useCallback(
    (isoUtc: string) => convertFromUTC(parseISO(isoUtc), state.timezone),
    [state.timezone]
  );

  const addStopwatchEntry = useCallback(
    async ({ heading, purpose, startLocalIso, endLocalIso }: { heading: string; purpose: string; startLocalIso: string; endLocalIso: string }) => {
      if (!user?.id) return;
      
      const startUtc = convertToUTC(parseISO(startLocalIso), state.timezone).toISOString();
      const endUtc = convertToUTC(parseISO(endLocalIso), state.timezone).toISOString();
      
      // Save to database
      const dbEntry = await createStopwatchSession(
        user.id,
        heading,
        purpose,
        startUtc,
        endUtc,
        state.timezone
      );
      
      if (dbEntry) {
        const entry: StopwatchEntry = {
          id: dbEntry.id,
          heading: dbEntry.heading,
          purpose: dbEntry.purpose,
          startUtc: dbEntry.start_time_utc,
          endUtc: dbEntry.end_time_utc,
          durationMs: dbEntry.duration_ms,
          createdAtUtc: dbEntry.created_at,
        };
        setState((prev) => {
          const next = { ...prev, stopwatch: [entry, ...prev.stopwatch] };
          persistState(next);
          return next;
        });
      }
    },
    [state.timezone, user?.id]
  );

  const addBedtimeEntry = useCallback(
    async ({ sleepLocalIso, wakeLocalIso, notes }: { sleepLocalIso: string; wakeLocalIso: string; notes?: string }) => {
      if (!user?.id) return;
      
      const sleepUtc = convertToUTC(parseISO(sleepLocalIso), state.timezone).toISOString();
      const wakeUtc = convertToUTC(parseISO(wakeLocalIso), state.timezone).toISOString();
      
      // Save to database
      const dbEntry = await createBedtimeLog(
        user.id,
        sleepUtc,
        wakeUtc,
        state.timezone,
        notes
      );
      
      if (dbEntry) {
        const entry: BedtimeEntry = {
          id: dbEntry.id,
          sleepUtc: dbEntry.sleep_time_utc,
          wakeUtc: dbEntry.wake_time_utc,
          durationMs: dbEntry.duration_ms,
          dateLabel: dbEntry.date_label,
        };
        setState((prev) => {
          const next = { ...prev, bedtime: [entry, ...prev.bedtime] };
          persistState(next);
          return next;
        });
      }
    },
    [state.timezone, user?.id]
  );

  const addAlarm = useCallback(
    async ({ title, source, triggerLocalIso, link }: { title: string; source: AlarmEntry["source"]; triggerLocalIso: string; link?: string }) => {
      if (!user?.id) return;
      
      const triggerUtc = convertToUTC(parseISO(triggerLocalIso), state.timezone).toISOString();
      
      // Save to database
      const dbEntry = await createAlarm(
        user.id,
        title,
        source,
        triggerUtc,
        state.timezone
      );
      
      if (dbEntry) {
        const entry: AlarmEntry = {
          id: dbEntry.id,
          title: dbEntry.title,
          source: dbEntry.source_type as AlarmEntry["source"],
          triggerUtc: dbEntry.trigger_time_utc,
          status: dbEntry.status as AlarmEntry["status"],
          link,
        };
        setState((prev) => {
          const next = { ...prev, alarms: [entry, ...prev.alarms] };
          persistState(next);
          return next;
        });
      }
    },
    [state.timezone, user?.id]
  );

  const updateAlarmStatusLocal = useCallback(
    async (id: string, status: AlarmEntry["status"], newTriggerLocalIso?: string) => {
      if (!user?.id) return;
      
      const newTriggerUtc = newTriggerLocalIso
        ? convertToUTC(parseISO(newTriggerLocalIso), state.timezone).toISOString()
        : undefined;
      
      // Update in database
      await updateAlarmStatus(user.id, id, status, newTriggerUtc);
      
      // Update local state
      setState((prev) => {
        const updated = prev.alarms.map((a) => {
          if (a.id !== id) return a;
          return { ...a, status, triggerUtc: newTriggerUtc || a.triggerUtc };
        });
        const next = { ...prev, alarms: updated };
        persistState(next);
        return next;
      });
    },
    [state.timezone, user?.id]
  );

  const deleteAlarmLocal = useCallback(async (id: string) => {
    if (!user?.id) return;
    
    // Delete from database
    await deleteAlarm(user.id, id);
    
    // Update local state
    setState((prev) => {
      const next = { ...prev, alarms: prev.alarms.filter((a) => a.id !== id) };
      persistState(next);
      return next;
    });
  }, [user?.id]);

  const value: TimeEngineContextValue = useMemo(
    () => ({
      timezone: state.timezone,
      timezoneOptions,
      setTimezone,
      formatWithTz,
      toUserDate,
      stopwatch: state.stopwatch,
      addStopwatchEntry,
      bedtime: state.bedtime,
      addBedtimeEntry,
      alarms: state.alarms,
      addAlarm,
      updateAlarmStatus: updateAlarmStatusLocal,
      deleteAlarm: deleteAlarmLocal,
    }),
    [
      state.timezone,
      timezoneOptions,
      setTimezone,
      formatWithTz,
      toUserDate,
      state.stopwatch,
      addStopwatchEntry,
      state.bedtime,
      addBedtimeEntry,
      state.alarms,
      addAlarm,
      updateAlarmStatus,
      deleteAlarm,
    ]
  );

  useEffect(() => {
    // Initialize timezone from browser if none stored
    if (!state.timezone) {
      const detected = getCurrentUserTimezone();
      setTimezone(detected);
    }
  }, [state.timezone, setTimezone]);

  return <TimeEngineContext.Provider value={value}>{children}</TimeEngineContext.Provider>;
}

export function useTimeEngine() {
  const ctx = useContext(TimeEngineContext);
  if (!ctx) throw new Error("useTimeEngine must be used inside TimeEngineProvider");
  return ctx;
}
