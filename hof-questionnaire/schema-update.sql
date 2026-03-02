-- ============================================================
-- HOF Questionnaire — Schema Update
-- Run this in Supabase > SQL Editor
-- ============================================================

-- 1. Add `key` column to questions table (if not already present)
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS key TEXT;

-- 2. Add unique index on key
CREATE UNIQUE INDEX IF NOT EXISTS questions_key_idx ON questions (key);

-- 3. Seed all 15 questionnaire questions
--    Uses INSERT ... ON CONFLICT to be idempotent (safe to re-run)
--    sort_order matches the slide order in questionnaire-data.js

INSERT INTO questions (key, text, type, sort_order)
VALUES
  ('intro',              'Brand Strategy Questionnaire',                     'input',    1),
  ('projektbeschreibung','Worum geht''s?',                                   'textarea', 2),
  ('hintergruende',      'Hintergründe',                                     'textarea', 3),
  ('zielgruppen',        'Zielgruppen',                                      'textarea', 4),
  ('zeitraum',           'Zeitraum',                                         'textarea', 5),
  ('vorhandenesMaterial','Vorhandenes Material',                             'textarea', 6),
  ('ziele',              'Ziele',                                            'textarea', 7),
  ('wettbewerb',         'Wettbewerb',                                       'textarea', 8),
  ('timeline',           'Markenvision (2 / 5 / 10 Jahre)',                  'textarea', 9),
  ('goldenCircle',       'Golden Circle (Why / How / What)',                 'textarea', 10),
  ('markenwerte',        'Markenwerte',                                      'textarea', 11),
  ('markenpersoenlichkeit','Markenpersönlichkeit',                           'textarea', 12),
  ('brandArchetype',     'Brand Archetype',                                  'textarea', 13),
  ('elevatorPitch',      'Elevator Pitch',                                   'textarea', 14),
  ('benchmarks',         'Benchmarks',                                       'textarea', 15)
ON CONFLICT (key) DO UPDATE
  SET text       = EXCLUDED.text,
      sort_order = EXCLUDED.sort_order;

-- 4. Back-fill key from text for any existing questions that have no key
--    (Only relevant if questions were inserted manually before this migration)
UPDATE questions SET key = 'projektbeschreibung' WHERE key IS NULL AND text ILIKE '%Projekt%beschreibung%';
UPDATE questions SET key = 'zielgruppen'         WHERE key IS NULL AND text ILIKE '%Zielgruppen%';

-- 5. Assign all 15 seeded questions to every existing customer
--    (is_active = true so they all show by default)
INSERT INTO customer_questions (customer_id, question_id, is_active)
SELECT c.id AS customer_id, q.id AS question_id, true AS is_active
FROM customers c
CROSS JOIN questions q
WHERE q.key IS NOT NULL
ON CONFLICT (customer_id, question_id) DO NOTHING;

-- Done!
-- After running this, open your app and the 15-slide carousel will work.
