# HOF Studio – Fragebogen App

Full-Stack-Anwendung mit **React + Tailwind CSS + Supabase**. 

---

## Stack

| Schicht | Technologie |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Supabase (PostgreSQL, Row-Level Security) |
| Auth | (optional) Supabase Auth für Admin-Schutz |
| E-Mail | Resend via Supabase Edge Function |

---

## Setup-Anleitung

### 1. Supabase-Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) → neues Projekt anlegen
2. Notiere dir **Project URL** und **anon key** aus *Settings → API*

### 2. Datenbank einrichten

Öffne den **SQL Editor** in Supabase und führe die Datei `schema.sql` aus.
Das erstellt alle 4 Tabellen und befüllt sie mit Standard-Fragen.

### 3. .env Datei anlegen

```bash
cp .env.example .env
```

Dann die Werte eintragen:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. Abhängigkeiten installieren & starten

```bash
npm install
npm run dev
```

Die App läuft dann auf **http://localhost:5173**

---

## E-Mail-Funktion (Resend)

### Resend Account einrichten

1. Account erstellen auf [resend.com](https://resend.com) (kostenloser Plan reicht)
2. Domain `hof-studio.com` verifizieren (DNS-Einträge setzen)
3. API-Key unter *API Keys* erstellen

### Edge Function deployen

```bash
# Supabase CLI installieren (falls noch nicht vorhanden)
brew install supabase/tap/supabase

# Einloggen
supabase login

# Projekt verknüpfen (Project-Ref findest du in den Supabase Settings)
supabase link --project-ref DEIN_PROJECT_REF

# Resend API-Key als Secret hinterlegen
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx

# Edge Function deployen
supabase functions deploy send-survey-email
```

> **Wichtig:** Der `FROM_EMAIL` in `supabase/functions/send-survey-email/index.ts` muss
> einer in Resend verifizierten Domain entsprechen (z.B. `fragebogen@hof-studio.com`).

---

## Routen

| Route | Beschreibung |
|---|---|
| `/admin` | Admin-Dashboard – Kunden anlegen, Fragen konfigurieren, vorbefüllen |
| `/survey/:slug` | Kunden-Fragebogen (mit vorbefüllten Antworten) |
| `/survey/:slug/danke` | Bestätigungsseite nach dem Absenden |

---

## Datenbankstruktur

```
customers
  id · name · email · slug · created_at

questions
  id · text · type · options (JSONB) · sort_order · default_active · created_at

customer_questions
  id · customer_id → customers · question_id → questions · is_active

responses
  id · customer_id → customers · question_id → questions · value · submitted_at · updated_at
```

---

## Deployment (Vercel)

```bash
# Vercel CLI
npm i -g vercel
vercel

# Env-Variablen in Vercel Dashboard hinterlegen:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

Da React Router clientseitig routet, muss Vercel alle Anfragen zu `index.html` umleiten.
Erstelle dazu eine `vercel.json` im Root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Admin-Bereich absichern (optional)

Aktuell ist `/admin` öffentlich zugänglich. Für Produktion empfehlen wir:

1. **Supabase Auth** aktivieren
2. Eine Login-Seite vor `/admin` schalten
3. RLS-Policies auf die Auth-User beschränken

---

## Fragen hinzufügen

Neue Fragen direkt per SQL einfügen:

```sql
insert into public.questions (text, type, sort_order, default_active)
values ('Ihre neue Frage?', 'textarea', 11, true);
```

Unterstützte Typen: `text`, `textarea`, `select`, `radio`, `checkbox`
Für `select`, `radio`, `checkbox` das `options`-Feld befüllen:

```sql
insert into public.questions (text, type, options, sort_order)
values ('Welches Paket?', 'radio', '["Starter","Professional","Enterprise"]', 12, true);
```
