CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(requester_id, recipient_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own connections"
    ON public.connections FOR ALL
    USING (auth.uid() = requester_id OR auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Enable real-time for connections
alter publication supabase_realtime add table connections;
