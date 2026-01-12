'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

// Define types for our timetable entries
interface TimetableEntry {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  category: 'work' | 'personal' | 'study' | 'meeting' | 'other';
  priority: 'low' | 'medium' | 'high';
}

// Define database type for Supabase
interface DbTimetableEntry {
  id: string;
  user_id: string;
  title: string;
  description: string;
  start_time: string; // Using ISO string format for Supabase
  end_time: string; // Using ISO string format for Supabase
  category: 'work' | 'personal' | 'study' | 'meeting' | 'other';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

// Define analytics data types
interface CategoryTimeData {
  name: string;
  time: number; // in hours
  color: string;
  [key: string]: any;
}

interface DailyTimeData {
  day: string;
  time: number; // in hours
}

interface AnalyticsProps {
  timetableEntries?: TimetableEntry[];
  // If timetableEntries is not provided, the component will fetch from database
}

const TimetableAnalytics: React.FC<AnalyticsProps> = ({ timetableEntries: propTimetableEntries }) => {
  const { user } = useAuth();
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (propTimetableEntries) {
      // Use the provided timetable entries
      setTimetableEntries(propTimetableEntries);
      // Simulate a brief loading state for consistency
      setTimeout(() => {
        setLoading(false);
      }, 0);
    } else {
      // Fetch timetable entries from database
      const fetchTimetableEntries = async () => {
        if (user && supabase) {
          try {
            const { data, error } = await supabase
              .from('timetable_entries')
              .select('*')
              .eq('user_id', user.id)
              .order('start_time', { ascending: false });
              
            if (error) throw error;
            
            if (data) {
              // Convert database entries to frontend format
              const formattedEntries: TimetableEntry[] = data.map(entry => ({
                id: entry.id,
                title: entry.title,
                description: entry.description,
                startTime: new Date(entry.start_time),
                endTime: new Date(entry.end_time),
                category: entry.category,
                priority: entry.priority,
              }));
              setTimetableEntries(formattedEntries);
            }
          } catch (error: any) {
            console.error('Error fetching timetable entries for analytics:', error.message);
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      };
      
      fetchTimetableEntries();
    }
  }, [user, propTimetableEntries]);
  // Calculate time spent in each category
  const calculateCategoryTime = (): CategoryTimeData[] => {
    const categoryTotals: Record<string, number> = {
      work: 0,
      personal: 0,
      study: 0,
      meeting: 0,
      other: 0
    };

    timetableEntries.forEach(entry => {
      const duration = (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60); // in hours
      categoryTotals[entry.category] += duration;
    });

    return [
      { name: 'Work', time: categoryTotals.work, color: '#1976d2' },
      { name: 'Personal', time: categoryTotals.personal, color: '#388e3c' },
      { name: 'Study', time: categoryTotals.study, color: '#f57c00' },
      { name: 'Meeting', time: categoryTotals.meeting, color: '#7b1fa2' },
      { name: 'Other', time: categoryTotals.other, color: '#616161' },
    ];
  };

  // Calculate time spent per day of week
  const calculateDailyTime = (): DailyTimeData[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayTotals: Record<string, number> = {
      'Sun': 0,
      'Mon': 0,
      'Tue': 0,
      'Wed': 0,
      'Thu': 0,
      'Fri': 0,
      'Sat': 0
    };

    timetableEntries.forEach(entry => {
      const day = days[entry.startTime.getDay()];
      const duration = (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60); // in hours
      dayTotals[day] += duration;
    });

    return Object.entries(dayTotals).map(([day, time]) => ({
      day,
      time: parseFloat(time.toFixed(2))
    }));
  };

  const categoryTimeData = calculateCategoryTime();
  const dailyTimeData = calculateDailyTime();

  // Calculate total time
  const totalTime = categoryTimeData.reduce((sum, item) => sum + item.time, 0);



  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Typography variant="h6" color="text.secondary">
          Loading analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
      <Card sx={{ flex: 1, minWidth: 300 }}>
        <CardHeader title="Time Distribution by Category" />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryTimeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="time"
                label={({ name, percent }: any) => `${name || ''}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
              >
                {categoryTimeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value?: number) => [`${Number(value || 0).toFixed(2)} hours`, 'Time']} />
            </PieChart>
          </ResponsiveContainer>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Total Time: {totalTime.toFixed(2)} hours
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ flex: 1, minWidth: 300 }}>
        <CardHeader title="Time Distribution by Day" />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dailyTimeData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value?: number) => [`${Number(value || 0).toFixed(2)} hours`, 'Time']} />
              <Legend />
              <Bar dataKey="time" fill="#8884d8" name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card sx={{ flex: 1, minWidth: 300 }}>
        <CardHeader title="Time Analytics Summary" />
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Time Usage Insights
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Total Scheduled Time:</strong> {totalTime.toFixed(2)} hours
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Most Active Category:</strong> {categoryTimeData.reduce((prev, current) => 
              (prev.time > current.time) ? prev : current
            ).name}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Busiest Day:</strong> {dailyTimeData.reduce((prev, current) => 
              (prev.time > current.time) ? prev : current
            ).day}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Average Daily Time:</strong> {(totalTime / 7).toFixed(2)} hours
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimetableAnalytics;