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
  addBedtimeEntry: (payload: { sleepLocalIso: string; wakeLocalIso: string }) => void;
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
    ({ heading, purpose, startLocalIso, endLocalIso }: { heading: string; purpose: string; startLocalIso: string; endLocalIso: string }) => {
      const startUtc = convertToUTC(parseISO(startLocalIso), state.timezone).toISOString();
      const endUtc = convertToUTC(parseISO(endLocalIso), state.timezone).toISOString();
      const durationMs = Math.max(0, differenceInMilliseconds(parseISO(endUtc), parseISO(startUtc)));
      const entry: StopwatchEntry = {
        id: crypto.randomUUID(),
        heading,
        purpose,
        startUtc,
        endUtc,
        durationMs,
        createdAtUtc: new Date().toISOString(),
      };
      setState((prev) => {
        const next = { ...prev, stopwatch: [entry, ...prev.stopwatch] };
        persistState(next);
        return next;
      });
    },
    [state.timezone]
  );

  const addBedtimeEntry = useCallback(
    ({ sleepLocalIso, wakeLocalIso }: { sleepLocalIso: string; wakeLocalIso: string }) => {
      const sleepUtc = convertToUTC(parseISO(sleepLocalIso), state.timezone).toISOString();
      const wakeUtc = convertToUTC(parseISO(wakeLocalIso), state.timezone).toISOString();
      const durationMs = Math.max(0, differenceInMilliseconds(parseISO(wakeUtc), parseISO(sleepUtc)));
      const dateLabel = formatWithTz(sleepUtc, "yyyy-MM-dd");
      const entry: BedtimeEntry = {
        id: crypto.randomUUID(),
        sleepUtc,
        wakeUtc,
        durationMs,
        dateLabel,
      };
      setState((prev) => {
        const next = { ...prev, bedtime: [entry, ...prev.bedtime] };
        persistState(next);
        return next;
      });
    },
    [formatWithTz, state.timezone]
  );

  const addAlarm = useCallback(
    ({ title, source, triggerLocalIso, link }: { title: string; source: AlarmEntry["source"]; triggerLocalIso: string; link?: string }) => {
      const triggerUtc = convertToUTC(parseISO(triggerLocalIso), state.timezone).toISOString();
      const entry: AlarmEntry = {
        id: crypto.randomUUID(),
        title,
        source,
        triggerUtc,
        status: "Active",
        link,
      };
      setState((prev) => {
        const next = { ...prev, alarms: [entry, ...prev.alarms] };
        persistState(next);
        return next;
      });
    },
    [state.timezone]
  );

  const updateAlarmStatus = useCallback(
    (id: string, status: AlarmEntry["status"], newTriggerLocalIso?: string) => {
      setState((prev) => {
        const updated = prev.alarms.map((a) => {
          if (a.id !== id) return a;
          const nextTriggerUtc = newTriggerLocalIso
            ? convertToUTC(parseISO(newTriggerLocalIso), state.timezone).toISOString()
            : a.triggerUtc;
          return { ...a, status, triggerUtc: nextTriggerUtc };
        });
        const next = { ...prev, alarms: updated };
        persistState(next);
        return next;
      });
    },
    [state.timezone]
  );

  const deleteAlarm = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, alarms: prev.alarms.filter((a) => a.id !== id) };
      persistState(next);
      return next;
    });
  }, []);

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
      updateAlarmStatus,
      deleteAlarm,
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
