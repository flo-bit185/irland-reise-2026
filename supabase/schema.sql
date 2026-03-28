-- ============================================
-- IRLAND REISE 2026 – Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PROPOSALS
-- ============================================
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT,
  category TEXT NOT NULL DEFAULT 'sightseeing'
    CHECK (category IN ('sightseeing', 'essen', 'aktivitaet', 'unterkunft', 'transport')),
  image_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOTES
-- ============================================
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proposal_id, user_id)
);

-- ============================================
-- CALENDAR EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'allgemein'
    CHECK (category IN ('allgemein', 'sightseeing', 'essen', 'aktivitaet', 'unterkunft', 'transport')),
  start_date DATE NOT NULL,
  end_date DATE,
  all_day BOOLEAN DEFAULT TRUE,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENT PARTICIPANTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_participants (
  event_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, user_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone can read, only own profile can be updated
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Proposals: everyone can read, authenticated can create
CREATE POLICY "proposals_select_all" ON public.proposals FOR SELECT USING (TRUE);
CREATE POLICY "proposals_insert_auth" ON public.proposals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "proposals_update_own" ON public.proposals FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "proposals_delete_own" ON public.proposals FOR DELETE USING (auth.uid() = created_by);

-- Votes: everyone can read, authenticated can vote (one per user per proposal via UNIQUE)
CREATE POLICY "votes_select_all" ON public.votes FOR SELECT USING (TRUE);
CREATE POLICY "votes_insert_auth" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_update_own" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "votes_delete_own" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- Calendar events: everyone can read, authenticated can create/edit/delete own
CREATE POLICY "events_select_all" ON public.calendar_events FOR SELECT USING (TRUE);
CREATE POLICY "events_insert_auth" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "events_update_auth" ON public.calendar_events FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "events_delete_own" ON public.calendar_events FOR DELETE USING (auth.uid() = created_by);

-- Event participants: everyone can read, authenticated can modify
CREATE POLICY "ep_select_all" ON public.event_participants FOR SELECT USING (TRUE);
CREATE POLICY "ep_insert_auth" ON public.event_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ep_delete_auth" ON public.event_participants FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- REALTIME
-- ============================================
-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_participants;

-- ============================================
-- SAMPLE DATA (optional – remove if not needed)
-- ============================================
-- INSERT INTO public.calendar_events (title, description, category, start_date, end_date)
-- VALUES
--   ('Ankunft Dublin', 'Ankunft am Flughafen, Check-in Hotel', 'transport', '2026-06-10', '2026-06-10'),
--   ('Dublin Stadtrundgang', 'Trinity College, Temple Bar, St. Patrick''s Cathedral', 'sightseeing', '2026-06-11', '2026-06-11'),
--   ('Fahrt nach Galway', 'Route über Cliffs of Moher', 'transport', '2026-06-12', '2026-06-12'),
--   ('Galway erkunden', 'Latin Quarter, Eyre Square, Shop Street', 'sightseeing', '2026-06-13', '2026-06-13'),
--   ('Ring of Kerry', 'Tagesausflug entlang der Küste', 'aktivitaet', '2026-06-14', '2026-06-14'),
--   ('Killarney Nationalpark', 'Wanderung im Park, Torc Wasserfall', 'aktivitaet', '2026-06-15', '2026-06-15'),
--   ('Rückflug', 'Transfer Flughafen Cork oder Kerry', 'transport', '2026-06-16', '2026-06-16');
