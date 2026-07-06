'use client';

import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, InputAdornment,
  Chip, Fade, IconButton, useTheme, alpha, Divider, LinearProgress
} from '@mui/material';
import { Search, X, Briefcase, Calendar, FileText, Clock, ArrowRight, History } from 'lucide-react';
import { UnifiedSearchResult, TaskHistoryEntry } from '../../lib/analytics-db';

const sourceConfig = {
  personal: { label: 'Personal', color: '#6366f1', icon: Calendar },
  professional: { label: 'Professional', color: '#3b82f6', icon: Briefcase },
  note: { label: 'Note', color: '#10b981', icon: FileText }
};

const statusColors: Record<string, string> = {
  completed: '#10b981', pending: '#f59e0b', rescheduled: '#6366f1', 'in-progress': '#3b82f6'
};

const actionIcons: Record<string, string> = {
  created: '🟢', rescheduled: '🔄', completed: '✅',
  status_changed: '⚡', priority_changed: '🎯', deleted: '🗑️', converted_from_note: '📝'
};

interface SearchPanelProps {
  results: UnifiedSearchResult[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectItem: (item: UnifiedSearchResult) => void;
  selectedItem: UnifiedSearchResult | null;
  taskHistory: TaskHistoryEntry[];
  onClose: () => void;
  loading: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  results, searchQuery, onSearchChange, onSelectItem,
  selectedItem, taskHistory, onClose, loading
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  const filteredResults = sourceFilter
    ? results.filter(r => r.source === sourceFilter)
    : results;

  return (
    <Card sx={{
      borderRadius: 4, border: '1px solid', borderColor: 'divider',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      background: isDark ? alpha('#1e293b', 0.8) : '#fff',
      overflow: 'hidden'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          🔍 Search Tasks & Notes
        </Typography>

        {/* Search Input */}
        <TextField
          fullWidth size="small" placeholder="Search by title, description, category..."
          value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}><X size={16} /></IconButton>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 3,
              bgcolor: isDark ? alpha('#334155', 0.5) : alpha('#f1f5f9', 0.8),
              '& fieldset': { border: 'none' },
              fontWeight: 600
            }
          }}
        />

        {/* Source Filter Chips */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          {['personal', 'professional', 'note'].map(src => {
            const config = sourceConfig[src as keyof typeof sourceConfig];
            return (
              <Chip
                key={src}
                label={config.label}
                size="small"
                onClick={() => setSourceFilter(sourceFilter === src ? null : src)}
                sx={{
                  fontWeight: 700, fontSize: '0.75rem', borderRadius: 2,
                  bgcolor: sourceFilter === src ? alpha(config.color, 0.15) : 'transparent',
                  color: sourceFilter === src ? config.color : 'text.secondary',
                  border: `1px solid ${sourceFilter === src ? config.color : isDark ? '#334155' : '#e2e8f0'}`,
                  '&:hover': { bgcolor: alpha(config.color, 0.1) }
                }}
              />
            );
          })}
        </Box>

        {loading && <LinearProgress sx={{ mt: 2, borderRadius: 2 }} />}

        {/* Results */}
        {searchQuery && (
          <Box sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
            {filteredResults.length === 0 && !loading ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4, fontSize: 14 }}>
                No results found for "{searchQuery}"
              </Typography>
            ) : (
              filteredResults.map((item, i) => {
                const config = sourceConfig[item.source];
                const Icon = config.icon;
                const isSelected = selectedItem?.id === item.id;
                return (
                  <Box
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    sx={{
                      p: 2, borderRadius: 3, mb: 1, cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isSelected ? config.color : 'transparent',
                      bgcolor: isSelected ? alpha(config.color, 0.05) : (isDark ? alpha('#334155', 0.3) : alpha('#f8fafc', 0.8)),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(config.color, 0.08),
                        borderColor: alpha(config.color, 0.3),
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: 2,
                        bgcolor: alpha(config.color, 0.1), color: config.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={16} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{item.title}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                          <Chip label={config.label} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: alpha(config.color, 0.1), color: config.color }} />
                          {item.status && (
                            <Chip label={item.status} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: alpha(statusColors[item.status] || '#6b7280', 0.1), color: statusColors[item.status] || '#6b7280' }} />
                          )}
                          {item.priority && (
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              {item.priority}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <ArrowRight size={16} color={isDark ? '#64748b' : '#94a3b8'} />
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        )}

        {/* Selected Item Detail Panel */}
        {selectedItem && (
          <Fade in>
            <Box sx={{
              mt: 3, p: 3, borderRadius: 3,
              bgcolor: isDark ? alpha('#0f172a', 0.6) : alpha('#f8fafc', 0.9),
              border: '1px solid', borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.1rem' }}>
                    {selectedItem.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={sourceConfig[selectedItem.source].label} size="small" sx={{ fontWeight: 700, bgcolor: alpha(sourceConfig[selectedItem.source].color, 0.1), color: sourceConfig[selectedItem.source].color }} />
                    {selectedItem.status && <Chip label={selectedItem.status} size="small" sx={{ fontWeight: 700, bgcolor: alpha(statusColors[selectedItem.status] || '#6b7280', 0.1), color: statusColors[selectedItem.status] || '#6b7280' }} />}
                    {selectedItem.priority && <Chip label={selectedItem.priority} size="small" variant="outlined" sx={{ fontWeight: 700 }} />}
                  </Box>
                </Box>
                <IconButton size="small" onClick={onClose}><X size={18} /></IconButton>
              </Box>

              {selectedItem.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {selectedItem.description}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Detail Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                {selectedItem.date && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>📅 Date</Typography>
                    <Typography variant="body2" fontWeight={600}>{new Date(selectedItem.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</Typography>
                  </Box>
                )}
                {selectedItem.category && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>📂 Category</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedItem.category}</Typography>
                  </Box>
                )}
                {selectedItem.department && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>🏢 Department</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedItem.department}</Typography>
                  </Box>
                )}
                {selectedItem.role && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>👤 Role</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedItem.role}</Typography>
                  </Box>
                )}
                {selectedItem.completion_feedback && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>💬 Feedback</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedItem.completion_feedback}</Typography>
                  </Box>
                )}
              </Box>

              {/* Task History Timeline */}
              {taskHistory.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <History size={16} /> Lifecycle Timeline
                  </Typography>
                  <Box sx={{ pl: 2, borderLeft: `2px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                    {taskHistory.map((entry, idx) => (
                      <Box key={entry.id} sx={{ mb: 2, position: 'relative', pl: 2 }}>
                        <Box sx={{
                          position: 'absolute', left: -9, top: 2,
                          width: 16, height: 16, borderRadius: '50%',
                          bgcolor: isDark ? '#1e293b' : '#fff',
                          border: '2px solid', borderColor: 'divider',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10
                        }}>
                          {actionIcons[entry.action] || '📋'}
                        </Box>
                        <Typography variant="body2" fontWeight={700}>
                          {entry.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {new Date(entry.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </Typography>
                        {entry.old_value && Object.keys(entry.old_value).length > 0 && (
                          <Typography variant="caption" sx={{ display: 'block', color: '#ef4444', fontWeight: 600 }}>
                            From: {JSON.stringify(entry.old_value)}
                          </Typography>
                        )}
                        {entry.new_value && Object.keys(entry.new_value).length > 0 && (
                          <Typography variant="caption" sx={{ display: 'block', color: '#10b981', fontWeight: 600 }}>
                            To: {JSON.stringify(entry.new_value)}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </CardContent>
    </Card>
  );
};
