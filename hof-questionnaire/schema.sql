-- ============================================================
-- HOF Questionnaire – Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- 1. customers
-- ────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  slug        text not null unique,   -- used in /survey/:slug
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 2. questions
-- ────────────────────────────────────────────────────────────
create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  text          text not null,
  type          text not null default 'text',   -- 'text' | 'textarea' | 'select' | 'radio' | 'checkbox'
  options       jsonb,                           -- for select/radio/checkbox: ["Option A","Option B"]
  sort_order    int not null default 0,
  default_active boolean not null default true,
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 3. customer_questions  (which questions are active per customer)
-- ────────────────────────────────────────────────────────────
create table if not exists public.customer_questions (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  question_id   uuid not null references public.questions(id) on delete cascade,
  is_active     boolean not null default true,
  unique (customer_id, question_id)
);

-- ────────────────────────────────────────────────────────────
-- 4. responses
-- ────────────────────────────────────────────────────────────
create table if not exists public.responses (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  question_id   uuid not null references public.questions(id) on delete cascade,
  value         text,                            -- stored as text; parse if needed
  submitted_at  timestamptz,                     -- null = prefilled, not yet submitted
  updated_at    timestamptz default now(),
  unique (customer_id, question_id)
);

-- ────────────────────────────────────────────────────────────
-- Row-Level Security (allow all for now; tighten in production)
-- ────────────────────────────────────────────────────────────
alter table public.customers         enable row level security;
alter table public.questions         enable row level security;
alter table public.customer_questions enable row level security;
alter table public.responses         enable row level security;

-- Public read policy for survey page (customers access via slug)
create policy "Public read customers by slug"
  on public.customers for select using (true);

create policy "Public read questions"
  on public.questions for select using (true);

create policy "Public read customer_questions"
  on public.customer_questions for select using (true);

create policy "Public read responses"
  on public.responses for select using (true);

-- Full access policies (lock these down with auth in production)
create policy "Full access customers"
  on public.customers for all using (true) with check (true);

create policy "Full access questions"
  on public.questions for all using (true) with check (true);

create policy "Full access customer_questions"
  on public.customer_questions for all using (true) with check (true);

create policy "Full access responses"
  on public.responses for all using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- Seed: Default questions
-- ────────────────────────────────────────────────────────────
insert into public.questions (text, type, sort_order, default_active) values
  ('Wie lautet Ihr vollständiger Unternehmensname?',                     'text',     1,  true),
  ('Was sind Ihre Hauptprodukte oder Dienstleistungen?',                 'textarea',  2,  true),
  ('Wer ist Ihre Zielgruppe?',                                           'textarea',  3,  true),
  ('Was unterscheidet Sie von Ihren Mitbewerbern?',                     'textarea',  4,  true),
  ('Welchen Ton/Stil soll Ihre Kommunikation haben?',                   'text',     5,  true),
  ('Gibt es bevorzugte Farben oder Designelemente?',                    'text',     6,  true),
  ('Was sind Ihre Ziele für das Projekt?',                              'textarea',  7,  true),
  ('Gibt es eine bestehende Website oder Social-Media-Präsenz?',        'text',     8,  true),
  ('Was ist Ihr Budget-Rahmen?',                                        'text',     9,  false),
  ('Was ist Ihr gewünschtes Fertigstellungsdatum?',                     'text',     10, true)
on conflict do nothing;
