-- ============================================================
-- AZDES UI Toolbox — Manager Portal Schema
-- Run this in the Supabase SQL Editor for your project.
-- ============================================================

-- ------------------------------------------------------------
-- Table: manager_content
-- Stores all manager-authored content (trends, tips, agent
-- cards, top actions, suggestions).  Agents read it without
-- authentication; only authenticated managers write to it.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manager_content (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section      TEXT        NOT NULL
                           CHECK (section IN (
                             'trend', 'tip', 'suggestion',
                             'agent_card', 'top_action'
                           )),
  title        TEXT        NOT NULL,
  body         TEXT        NOT NULL,
  priority     TEXT        DEFAULT 'medium'
                           CHECK (priority IN ('high', 'medium', 'low')),
  expires_on   DATE,
  author_id    UUID        REFERENCES auth.users (id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  is_active    BOOLEAN     DEFAULT true NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER manager_content_updated_at
  BEFORE UPDATE ON public.manager_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- Row-Level Security
-- ------------------------------------------------------------
ALTER TABLE public.manager_content ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (including unauthenticated agents) can read
-- active, non-expired entries.
CREATE POLICY "public_read_active"
  ON public.manager_content
  FOR SELECT
  USING (
    is_active = true
    AND (expires_on IS NULL OR expires_on >= CURRENT_DATE)
  );

-- Managers can insert their own entries.
CREATE POLICY "manager_insert"
  ON public.manager_content
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

-- Managers can update only their own entries.
CREATE POLICY "manager_update_own"
  ON public.manager_content
  FOR UPDATE
  USING (auth.uid() = author_id);

-- Managers can soft-delete (set is_active = false) only their own entries.
-- Hard deletes on own rows are also allowed.
CREATE POLICY "manager_delete_own"
  ON public.manager_content
  FOR DELETE
  USING (auth.uid() = author_id);

-- ------------------------------------------------------------
-- Enable Realtime for live notification pushes
-- ------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.manager_content;

-- ------------------------------------------------------------
-- Optional: seed a sample entry to validate setup
-- (comment out before production use)
-- ------------------------------------------------------------
-- INSERT INTO public.manager_content (section, title, body, priority, author_id)
-- VALUES (
--   'tip',
--   'Manager portal live',
--   'This entry was created via the manager portal schema seed.',
--   'low',
--   auth.uid()   -- run this while logged in as a manager
-- );
