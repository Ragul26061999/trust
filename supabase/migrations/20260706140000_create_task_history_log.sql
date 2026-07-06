-- Task History Log: Records every lifecycle event for tasks and notes
-- This powers the advanced analytics/tracking on the Analytical page

CREATE TABLE IF NOT EXISTS task_history_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  task_source TEXT NOT NULL CHECK (task_source IN ('personal', 'professional', 'note')),
  action TEXT NOT NULL CHECK (action IN ('created', 'rescheduled', 'completed', 'status_changed', 'priority_changed', 'deleted', 'converted_from_note')),
  old_value JSONB DEFAULT '{}'::jsonb,
  new_value JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast analytical queries
CREATE INDEX IF NOT EXISTS idx_task_history_user ON task_history_log(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history_log(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_action ON task_history_log(action);
CREATE INDEX IF NOT EXISTS idx_task_history_date ON task_history_log(created_at);
CREATE INDEX IF NOT EXISTS idx_task_history_source ON task_history_log(task_source);

-- RLS Policies
ALTER TABLE task_history_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task history"
  ON task_history_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task history"
  ON task_history_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own task history"
  ON task_history_log FOR DELETE
  USING (auth.uid() = user_id);
