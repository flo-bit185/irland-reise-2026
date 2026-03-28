# 🍀 Irland Reise 2026 – Setup-Anleitung

## 1. Supabase Projekt einrichten

1. Gehe zu [supabase.com](https://supabase.com) → **New Project**
2. Name: `irland-reise-2026`
3. Region: `eu-central-1` (Frankfurt)
4. Warte bis das Projekt erstellt ist (~2 Min)

### Datenbank einrichten
1. Supabase Dashboard → **SQL Editor** → **New Query**
2. Kopiere den Inhalt von `supabase/schema.sql` und füge ihn ein
3. Klicke **Run** → Alle Tabellen werden erstellt

### API-Schlüssel holen
1. Supabase Dashboard → **Settings** → **API**
2. Kopiere:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** Key → `VITE_SUPABASE_ANON_KEY`

### Google OAuth aktivieren
1. Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Aktiviere Google OAuth
3. Gehe zur [Google Cloud Console](https://console.cloud.google.com)
4. Erstelle ein neues Projekt (oder wähle ein bestehendes)
5. APIs & Services → **OAuth 2.0 Client IDs** → **Web application**
6. Authorisierte Weiterleitungs-URLs hinzufügen:
   - `https://DEIN-PROJEKT.supabase.co/auth/v1/callback`
   - (nach Vercel-Deploy: auch die Vercel-URL)
7. Client ID und Client Secret in Supabase eintragen

---

## 2. Lokal entwickeln

```bash
# Abhängigkeiten installieren
npm install

# .env Datei erstellen
cp .env.example .env
# Dann .env mit deinen Supabase-Werten ausfüllen

# Entwicklungsserver starten
npm run dev
# → http://localhost:5173
```

---

## 3. Auf Vercel deployen

### Option A: Via GitHub (empfohlen)
1. Push dieses Repo zu GitHub
2. Gehe zu [vercel.com](https://vercel.com) → **Add New Project**
3. Wähle das GitHub Repo aus
4. **Environment Variables** hinzufügen:
   - `VITE_SUPABASE_URL` = deine Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = dein Supabase anon key
5. Klicke **Deploy** → fertig!

### Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel
# Folge den Anweisungen
# Vergiss nicht die Environment Variables zu setzen!
```

### Nach dem Deploy: Supabase Redirect URLs aktualisieren
1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: `https://deine-app.vercel.app`
3. **Redirect URLs** hinzufügen: `https://deine-app.vercel.app/**`
4. Google OAuth Redirect URL aktualisieren (in der Google Cloud Console)

---

## 4. Teilnehmer hinzufügen

Einfach den App-Link teilen! Jeder kann sich mit Google anmelden und wird automatisch zur Teilnehmerliste hinzugefügt.

---

## Technologie-Stack

| Layer | Technologie |
|-------|-------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| Karte | Leaflet + React-Leaflet |
| Kalender | FullCalendar v6 |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Deploy | Vercel |
| Login | Google OAuth via Supabase |

---

## Features

- 🗺️ **Interaktive Karte** mit Irland-Reiseroute (Leaflet)
- 👥 **Teilnehmer-Übersicht** mit Online-Status in Echtzeit
- 💡 **Vorschläge** – Attraktionen/Restaurants vorschlagen mit Kategorien & Votes
- 📅 **Kalender** – FullCalendar mit Drag & Drop, Farbcodierung, Teilnehmer-Zuordnung
- 🗳️ **Abstimmung** – Upvote/Downvote mit Live-Ranking und Fortschrittsbalken
- 🔐 **Google OAuth** Login
- ⚡ **Realtime** – Alle Updates sofort für alle sichtbar
- 📱 **Mobile-first** responsive Design
