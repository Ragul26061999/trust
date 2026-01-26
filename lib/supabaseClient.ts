import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkezubbjstrixkpqjias.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprZXp1YmJqc3RyaXhrcHFqaWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTUzMTYsImV4cCI6MjA4MzM3MTMxNn0.MgNnEbpZ-WM_W7ehpQtlBEnKYYMbFMhhvPDOTUo8jR4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);