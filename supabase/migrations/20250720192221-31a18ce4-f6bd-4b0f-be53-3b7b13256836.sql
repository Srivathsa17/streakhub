
-- Update leaderboard visibility by allowing everyone to see basic streak data for rankings
CREATE POLICY "Streaks are viewable by everyone for leaderboard" 
ON public.streaks 
FOR SELECT 
USING (true);

-- Create friends table for user connections
CREATE TABLE public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_user_id)
);

-- Enable RLS on friends table
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Create policies for friends table
CREATE POLICY "Users can view their own friend requests and connections" 
ON public.friends 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_user_id);

CREATE POLICY "Users can create friend requests" 
ON public.friends 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend requests they received" 
ON public.friends 
FOR UPDATE 
USING (auth.uid() = friend_user_id);

CREATE POLICY "Users can delete their friend connections" 
ON public.friends 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = friend_user_id);

-- Create function to get user's total XP (for public access)
CREATE OR REPLACE FUNCTION public.get_user_total_xp(target_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(xp_earned), 0)::INTEGER
  FROM public.streaks
  WHERE user_id = target_user_id;
$$;

-- Create function to get user's current streak (for public access)
CREATE OR REPLACE FUNCTION public.get_user_current_streak(target_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  WITH streak_dates AS (
    SELECT date
    FROM public.streaks
    WHERE user_id = target_user_id
    ORDER BY date DESC
  ),
  consecutive_days AS (
    SELECT date,
           ROW_NUMBER() OVER (ORDER BY date DESC) as rn,
           date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY date DESC) - 1) as expected_date
    FROM streak_dates
  )
  SELECT COUNT(*)::INTEGER
  FROM consecutive_days
  WHERE expected_date = (SELECT MAX(date) FROM streak_dates) - INTERVAL '1 day' * (rn - 1)
    AND date >= CURRENT_DATE - INTERVAL '1 day' * (
      SELECT COUNT(*) FROM consecutive_days WHERE expected_date = date
    );
$$;
