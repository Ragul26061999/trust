'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, useTheme, alpha } from '@mui/material';
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer,
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, LineChart as ReLineChart, Line
} from 'recharts';

// ─── Chart Wrapper (Fixes Recharts negative size warnings during animations) ───
const ChartWrapper = ({ children, height }: { children: React.ReactNode, height: number }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  return (
    <Box sx={{ height, width: '100%' }}>
      {mounted && children}
    </Box>
  );
};

// ─── Completion Trend Chart ───
export const CompletionTrendChart = ({ data }: { data: { date: string; completed: number; created: number; rescheduled: number }[] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <Card sx={{
      borderRadius: 4, border: '1px solid', borderColor: 'divider',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%',
      background: isDark ? alpha('#1e293b', 0.6) : '#fff'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2, fontSize: '1rem' }}>
          📈 Activity Trend
        </Typography>
        <ChartWrapper height={280}>
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: textColor }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: textColor }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#1e293b' : '#fff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: 12, fontSize: 12, fontWeight: 600
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              <Area type="monotone" dataKey="completed" stroke="#10b981" fill="url(#completedGrad)" strokeWidth={2.5} name="Completed" />
              <Area type="monotone" dataKey="created" stroke="#3b82f6" fill="url(#createdGrad)" strokeWidth={2.5} name="Created" />
              <Line type="monotone" dataKey="rescheduled" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Rescheduled" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </CardContent>
    </Card>
  );
};

// ─── Pie Chart Component (reusable) ───
export const DistributionPieChart = ({ data, title, icon }: {
  data: { name: string; value: number; color: string }[];
  title: string;
  icon: string;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!data || data.length === 0) {
    return (
      <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%', background: isDark ? alpha('#1e293b', 0.6) : '#fff' }}>
        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2, fontSize: '1rem' }}>{icon} {title}</Typography>
          <Typography color="text.secondary" fontSize={14}>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card sx={{
      borderRadius: 4, border: '1px solid', borderColor: 'divider',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%',
      background: isDark ? alpha('#1e293b', 0.6) : '#fff'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1, fontSize: '1rem' }}>{icon} {title}</Typography>
        <ChartWrapper height={220}>
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <RePieChart>
              <Pie
                data={data} cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: isDark ? '#1e293b' : '#fff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: 12, fontSize: 12, fontWeight: 600
                }}
                formatter={(value: any) => [`${value} (${Math.round((value / total) * 100)}%)`, '']}
              />
            </RePieChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 2 }}>
          {data.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                {item.name} ({item.value})
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// ─── Status Bar Chart ───
export const StatusBarChart = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <Card sx={{
      borderRadius: 4, border: '1px solid', borderColor: 'divider',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%',
      background: isDark ? alpha('#1e293b', 0.6) : '#fff'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2, fontSize: '1rem' }}>
          📊 Task Status Breakdown
        </Typography>
        <ChartWrapper height={280}>
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <ReBarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: textColor, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 11, fill: textColor }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#1e293b' : '#fff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: 12, fontSize: 12, fontWeight: 600
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Tasks">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </CardContent>
    </Card>
  );
};

// ─── Burndown Velocity Chart ───
export const BurndownChart = ({ data }: { data: { date: string; pending: number }[] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <Card sx={{
      borderRadius: 4, border: '1px solid', borderColor: 'divider',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%',
      background: isDark ? alpha('#1e293b', 0.6) : '#fff'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2, fontSize: '1rem' }}>
          📉 Burndown Velocity
        </Typography>
        <ChartWrapper height={280}>
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: textColor }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: textColor }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#1e293b' : '#fff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: 12, fontSize: 12, fontWeight: 600
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              <Area type="monotone" dataKey="pending" stroke="#ef4444" fill="url(#pendingGrad)" strokeWidth={2.5} name="Pending Backlog" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </CardContent>
    </Card>
  );
};
