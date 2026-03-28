# 🍀 Irland Reise 2026 – Setup-Anleitung

Kein Cloud-Konto nötig. Einfach Node.js installieren, starten, fertig.

---

## Lokal starten (Entwicklung)

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API-Server: http://localhost:3001
- Passwort: **3747xjdu**

Die Datenbank (`data.db`) wird beim ersten Start automatisch angelegt.

---

## Produktion (auf einem eigenen Server / VPS)

```bash
npm install
npm run build        # React-App bauen → dist/
npm start            # Express startet auf Port 3001 und serviert alles
```

Zugriff über http://DEIN-SERVER:3001

### Mit eigenem Port
```bash
PORT=8080 npm start
```

### Passwort ändern
```bash
APP_PASSWORD=neuesPasswort npm start
```

Oder eine `.env`-Datei anlegen (Kopie von `.env.example`).

---

## Kostenloses Cloud-Hosting (ohne Vercel)

### Option A – Railway
1. https://railway.app → New Project → GitHub Repo importieren
2. Environment Variable setzen: `APP_PASSWORD=3747xjdu`
3. Deploy → Railway gibt dir eine URL

### Option B – Render
1. https://render.com → New Web Service → GitHub Repo
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Environment Variable: `APP_PASSWORD=3747xjdu`
5. Deploy → Render gibt dir eine URL

### Option C – Fly.io
```bash
npm install -g flyctl
fly launch
fly deploy
```

---

## App-Funktionen

| Feature          | Details |
|------------------|---------|
| 🔑 Login          | Gruppen-Passwort + dein Name |
| 🗺️ Karte          | Leaflet mit Dublin→Killarney-Route |
| 💡 Vorschläge     | Erstellen, kategorisieren, voten |
| 📅 Kalender       | FullCalendar, Drag & Drop |
| 🗳️ Abstimmung     | Live-Ranking mit Fortschrittsbalken |
| 👥 Teilnehmer     | Online-Status (automatisch) |
| 🔄 Realtime       | Polling alle 10–15 Sekunden |

## Daten-Sicherung

Die SQLite-Datei `data.db` enthält alle Daten. Einfach kopieren zum Sichern.

```bash
cp data.db data.db.backup
```
