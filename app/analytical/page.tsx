'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth-context';
import useTranslations from '../../lib/use-translations';
import ProtectedLayout from '../protected-layout';
import {
  Box, Container, Typography, Grid, Card, CardContent, IconButton,
  CircularProgress, Fade, Chip, LinearProgress, useTheme, alpha,
  Select, MenuItem, FormControl, Tooltip
} from '@mui/material';
import {
  ArrowLeft, BarChart3, TrendingUp, Calendar, Target, Activity,
  Zap, Sparkles, RefreshCw, FileText, Briefcase, CheckCircle2,
  Clock, Flame, ArrowUpRight, ArrowDownRight, AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getFullAnalytics, searchAllItems, getTaskHistory, getInsights,
  AnalyticsSummary, UnifiedSearchResult, TaskHistoryEntry
} from '../../lib/analytics-db';
import { CompletionTrendChart, DistributionPieChart, StatusBarChart } from '../../components/analytics/AnalyticsCharts';
import { SearchPanel } from '../../components/analytics/SearchPanel';

// ─── PREMIUM HORIZONTAL KPI CARD ───
const KPICard = ({ icon: Icon, label, value, suffix, color, subLabel, trend }: {
  icon: any; label: string; value: number | string; suffix?: string;
  color: string; subLabel?: string; trend?: 'up' | 'down' | 'neutral';
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card sx={{
      height: 115,
      borderRadius: 4,
      border: '1px solid',
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 18px rgba(149,157,165,0.05)',
      background: isDark 
        ? `linear-gradient(135deg, ${alpha('#1e293b', 0.8)} 0%, ${alpha('#0f172a', 0.8)} 100%)`
        : `linear-gradient(135deg, #ffffff 0%, ${alpha('#f8fafc', 0.8)} 100%)`,
      backdropFilter: 'blur(12px)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 30px ${alpha(color, 0.15)}`,
        borderColor: alpha(color, 0.4),
        '& .kpi-icon-container': {
          transform: 'scale(1.05)',
          background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
          color: '#fff',
        }
      }
    }}>
      <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
        {/* Icon Container */}
        <Box 
          className="kpi-icon-container"
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3.5,
            bgcolor: alpha(color, 0.1),
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            flexShrink: 0
          }}
        >
          <Icon size={22} />
        </Box>

        {/* Content Stack */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography 
            variant="caption" 
            fontWeight={700} 
            color="text.secondary" 
            sx={{ 
              display: 'block', 
              mb: 0.5, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              fontSize: '0.68rem' 
            }}
          >
            {label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography variant="h5" fontWeight={900} sx={{ fontSize: '1.35rem', color: isDark ? '#f8fafc' : '#0f172a', lineHeight: 1.1 }}>
              {value}
            </Typography>
            {suffix && (
              <Typography variant="body2" fontWeight={800} color="text.secondary">
                {suffix}
              </Typography>
            )}
          </Box>
          {subLabel && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              {trend && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {trend === 'up' ? <ArrowUpRight size={13} color="#10b981" /> :
                   trend === 'down' ? <ArrowDownRight size={13} color="#ef4444" /> : null}
                </Box>
              )}
              <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap sx={{ fontSize: '0.7rem' }}>
                {subLabel}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// ─── Today's Pulse Component ───
const TodaysPulse = ({ tasks, completed, total }: {
  tasks: AnalyticsSummary['todaysTasks']; completed: number; total: number;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const priorityColors: Record<string, string> = {
    High: '#ef4444', Urgent: '#dc2626', Medium: '#f59e0b', Low: '#10b981',
    high: '#ef4444', urgent: '#dc2626', medium: '#f59e0b', low: '#10b981'
  };

  return (
    <Card sx={{
      borderRadius: 4,
      border: '1px solid',
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      background: isDark
        ? `linear-gradient(135deg, ${alpha('#1e293b', 0.8)} 0%, ${alpha('#0f172a', 0.6)} 100%)`
        : 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
            ⚡ Today&apos;s Pulse
          </Typography>
          <Chip
            label={`${completed}/${total} done`}
            size="small"
            sx={{
              fontWeight: 800, fontSize: '0.75rem',
              bgcolor: progress === 100 ? alpha('#10b981', 0.1) : alpha('#f59e0b', 0.1),
              color: progress === 100 ? '#10b981' : '#f59e0b'
            }}
          />
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate" value={progress}
            sx={{
              height: 10, borderRadius: 5,
              bgcolor: isDark ? '#334155' : '#e2e8f0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: progress === 100
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
                boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mt: 0.5 }}>
            {Math.round(progress)}% complete
          </Typography>
        </Box>

        {/* Task List */}
        {tasks.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3, fontSize: 14 }}>
            🎉 No tasks scheduled for today — enjoy your day!
          </Typography>
        ) : (
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {tasks.map((task) => {
              const isOverdue = task.status !== 'completed' && new Date(task.time) < new Date();
              return (
                <Box key={task.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                  borderRadius: 2.5, mb: 0.5,
                  bgcolor: task.status === 'completed'
                    ? alpha('#10b981', 0.05)
                    : (isOverdue ? alpha('#ef4444', 0.05) : 'transparent'),
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: isDark ? alpha('#334155', 0.5) : alpha('#f1f5f9', 0.8) }
                }}>
                  <Box sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    bgcolor: priorityColors[task.priority] || '#6b7280',
                    flexShrink: 0
                  }} />
                  <Typography variant="body2" fontWeight={700} sx={{
                    flex: 1, textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    opacity: task.status === 'completed' ? 0.6 : 1, fontSize: '0.85rem'
                  }}>
                    {task.title}
                  </Typography>
                  <Chip
                    label={task.source === 'personal' ? 'P' : 'W'}
                    size="small"
                    sx={{
                      height: 20, minWidth: 20, fontSize: '0.6rem', fontWeight: 800,
                      bgcolor: alpha(task.source === 'personal' ? '#6366f1' : '#3b82f6', 0.1),
                      color: task.source === 'personal' ? '#6366f1' : '#3b82f6'
                    }}
                  />
                  {isOverdue && <AlertTriangle size={14} color="#ef4444" />}
                  {task.status === 'completed' && <CheckCircle2 size={14} color="#10b981" />}
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Insights Card ───
const InsightsCard = ({ insights }: { insights: string[] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card sx={{
      borderRadius: 4,
      border: '1px solid',
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%',
      background: isDark
        ? `linear-gradient(135deg, ${alpha('#1e293b', 0.8)} 0%, ${alpha('#0f172a', 0.6)} 100%)`
        : 'linear-gradient(135deg, #fefce8 0%, #fff 100%)',
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles size={18} color="#f59e0b" /> Smart Insights
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {insights.map((insight, i) => (
            <Box key={i} sx={{
              p: 2, borderRadius: 3,
              bgcolor: isDark ? alpha('#334155', 0.3) : alpha('#f8fafc', 0.8),
              border: '1px solid', borderColor: isDark ? '#334155' : '#e2e8f0',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateX(4px)', borderColor: '#f59e0b' }
            }}>
              <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.6, fontSize: '0.85rem' }}>
                {insight}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// ─── Upcoming Deadlines ───
const UpcomingDeadlines = ({ deadlines }: { deadlines: AnalyticsSummary['upcomingDeadlines'] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card sx={{
      borderRadius: 4,
      border: '1px solid',
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%',
      background: isDark ? alpha('#1e293b', 0.6) : '#fff'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Clock size={18} color="#6366f1" /> Upcoming (7 Days)
        </Typography>
        {deadlines.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3, fontSize: 14 }}>
            No upcoming deadlines — you&apos;re ahead of schedule! 🎉
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {deadlines.slice(0, 8).map((item) => (
              <Box key={item.id} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                borderRadius: 2.5,
                bgcolor: isDark ? alpha('#334155', 0.3) : alpha('#f8fafc', 0.8),
                '&:hover': { bgcolor: isDark ? alpha('#334155', 0.5) : alpha('#f1f5f9', 0.8) }
              }}>
                <Calendar size={14} color="#6366f1" />
                <Typography variant="body2" fontWeight={700} sx={{ flex: 1, fontSize: '0.85rem' }} noWrap>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════
// ─── MAIN PAGE CONTENT ───
// ═══════════════════════════════════════════════

let cachedAnalytics: AnalyticsSummary = {
  productivityScore: 0,
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  completionRate: 0,
  activeStreak: 0,
  rescheduleRatio: 0,
  rescheduledTasks: 0,
  totalNotes: 0,
  notesConvertedToTasks: 0,
  noteConversionRate: 0,
  dailyCompletionTrend: [],
  categoryDistribution: [],
  priorityDistribution: [],
  statusDistribution: [],
  todaysTasks: [],
  todaysCompleted: 0,
  todaysTotal: 0,
  upcomingDeadlines: [],
  sourceDistribution: [],
  personalTasks: [],
  professionalTasks: [],
  notes: []
};
let cachedInsights: string[] = [];

const AnalyticalPageContent = () => {
  const { user } = useAuth();
  const { t } = useTranslations('common');
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [analytics, setAnalytics] = useState<AnalyticsSummary>(cachedAnalytics);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UnifiedSearchResult | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskHistoryEntry[]>([]);
  const [insights, setInsights] = useState<string[]>(cachedInsights);

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    if (!user) return;
    if (!cachedAnalytics) setLoading(true);
    try {
      const data = await getFullAnalytics(user.id, timeRange);
      cachedAnalytics = data;
      const newInsights = getInsights(data);
      cachedInsights = newInsights;
      setAnalytics(data);
      setInsights(newInsights);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user, timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Search handler
  useEffect(() => {
    if (!user || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchAllItems(user.id, searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  // Fetch task history when item is selected
  const handleSelectItem = async (item: UnifiedSearchResult) => {
    setSelectedItem(item);
    if (user) {
      const history = await getTaskHistory(user.id, item.id);
      setTaskHistory(history);
    }
  };



  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        bgcolor: alpha(theme.palette.background.paper, 0.85),
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: { xs: 2, md: 4 },
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ color: 'text.primary' }}>
            <ArrowLeft size={22} />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BarChart3 size={18} color="white" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900} sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.2rem', md: '1.4rem' }
              }}>
                {t('analytical.title')}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {t('analytical.subtitle')}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchData} sx={{ color: 'text.secondary' }}>
                <RefreshCw size={18} />
              </IconButton>
            </Tooltip>
            <FormControl size="small" sx={{
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3, fontWeight: 700, fontSize: '0.8rem',
                bgcolor: isDark ? alpha('#334155', 0.5) : '#f8fafc',
                '& fieldset': { borderColor: isDark ? '#334155' : '#e2e8f0' }
              }
            }}>
              <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                <MenuItem value="7days"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Calendar size={14} /> Last 7 Days</Box></MenuItem>
                <MenuItem value="30days"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TrendingUp size={14} /> Last 30 Days</Box></MenuItem>
                <MenuItem value="90days"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Activity size={14} /> Last 90 Days</Box></MenuItem>
                <MenuItem value="1year"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Target size={14} /> Last Year</Box></MenuItem>
                <MenuItem value="all"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Zap size={14} /> All Time</Box></MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Page Content */}
      <Fade in timeout={400}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* KPI Cards Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard icon={Zap} label="Productivity" value={analytics.productivityScore} suffix="%" color="#6366f1"
                subLabel="Overall score" trend={analytics.productivityScore >= 50 ? 'up' : 'down'} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard icon={Target} label="Total Tasks" value={analytics.totalTasks} color="#3b82f6"
                subLabel={`${analytics.completedTasks} completed`} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard icon={CheckCircle2} label="Completion" value={analytics.completionRate} suffix="%" color="#10b981"
                trend={analytics.completionRate >= 50 ? 'up' : 'down'} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard icon={Flame} label="Streak" value={analytics.activeStreak} suffix=" d" color="#f59e0b"
                subLabel="Keep going!" trend={analytics.activeStreak > 0 ? 'up' : 'neutral'} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard icon={RefreshCw} label="Reschedule" value={analytics.rescheduleRatio} suffix="%" color="#ef4444"
                subLabel={`${analytics.rescheduledTasks} tasks`} trend={analytics.rescheduleRatio > 30 ? 'down' : 'up'} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KPICard icon={FileText} label="Notes" value={analytics.totalNotes} color="#8b5cf6"
                subLabel={`${analytics.noteConversionRate}% → tasks`} />
            </Grid>
          </Grid>

          {/* Deep Search Engine & Lifecycle tracker */}
          <Box sx={{ mb: 4 }}>
            <SearchPanel
              results={searchResults}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectItem={handleSelectItem}
              selectedItem={selectedItem}
              taskHistory={taskHistory}
              onClose={() => { setSelectedItem(null); setTaskHistory([]); }}
              loading={searchLoading}
            />
          </Box>

          {/* TWO-COLUMN SIDEBAR LAYOUT (Left: Main Analytics, Right: Pulse & Smart Sidebar) */}
          <Grid container spacing={3}>
            {/* LEFT MAIN CONTENT (8 columns on Desktop) */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Section 1: Completion Trend */}
                <CompletionTrendChart data={analytics.dailyCompletionTrend} />

                {/* Section 2: Distribution Analytics */}
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DistributionPieChart data={analytics.categoryDistribution} title="Categories" icon="📂" />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <DistributionPieChart data={analytics.priorityDistribution} title="Priority Levels" icon="🎯" />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <StatusBarChart data={analytics.statusDistribution} />
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* RIGHT SIDEBAR (4 columns on Desktop) */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* 1. Today's Pulse */}
                <TodaysPulse tasks={analytics.todaysTasks} completed={analytics.todaysCompleted} total={analytics.todaysTotal} />

                {/* 2. Smart Insights */}
                <InsightsCard insights={insights} />

                {/* 3. Upcoming Deadlines */}
                <UpcomingDeadlines deadlines={analytics.upcomingDeadlines} />

                {/* 4. Source Distribution */}
                <DistributionPieChart data={analytics.sourceDistribution} title="Source Breakdown" icon="📊" />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Fade>
    </Box>
  );
};

export default function AnalyticalPage() {
  return (
    <ProtectedLayout>
      <AnalyticalPageContent />
    </ProtectedLayout>
  );
}