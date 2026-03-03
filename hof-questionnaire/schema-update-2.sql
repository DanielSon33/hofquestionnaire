-- ============================================================
-- HOF Questionnaire — Schema Update 2
-- Run this in Supabase > SQL Editor
-- ============================================================

-- 1. Add override columns to questions table
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS title_override TEXT,
  ADD COLUMN IF NOT EXISTS description_override TEXT;

-- 2. Create Supabase Storage bucket for file uploads
-- (Run this once — safe to re-run, it will just do nothing if exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('questionnaire-uploads', 'questionnaire-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policy: anyone can upload (for survey takers)
CREATE POLICY IF NOT EXISTS "Public upload questionnaire-uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'questionnaire-uploads');

-- 4. Storage policy: anyone can read (for admin viewing)
CREATE POLICY IF NOT EXISTS "Public read questionnaire-uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'questionnaire-uploads');

-- Done!
-- After running this:
-- 1. Re-deploy the edge function (see README for instructions)
-- 2. In Resend: verify hof-studio.com domain, then set FROM_EMAIL secret
-- 3. Run: supabase secrets set FROM_EMAIL=fragebogen@hof-studio.com
