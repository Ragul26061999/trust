CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_read BOOLEAN DEFAULT false
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can read their messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can update read status of received messages"
    ON public.messages FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- Enable real-time for messages
alter publication supabase_realtime add table messages;
