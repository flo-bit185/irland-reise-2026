const express = require('express')
const Database = require('better-sqlite3')
const path = require('path')
const { randomUUID } = require('crypto')

const app = express()
const PORT = process.env.PORT || 3001
const PASSWORD = process.env.APP_PASSWORD || '3747xjdu'

// ── Database setup ────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'data.db'))
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_online INTEGER DEFAULT 0,
    last_seen TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    url         TEXT,
    category    TEXT NOT NULL DEFAULT 'sightseeing',
    image_url   TEXT,
    created_by  TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS votes (
    id          TEXT PRIMARY KEY,
    proposal_id TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL,
    vote_type   TEXT NOT NULL CHECK (vote_type IN ('up','down')),
    created_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(proposal_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS calendar_events (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    category    TEXT DEFAULT 'allgemein',
    start_date  TEXT NOT NULL,
    end_date    TEXT,
    all_day     INTEGER DEFAULT 1,
    created_by  TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS event_participants (
    event_id TEXT NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    user_id  TEXT NOT NULL,
    PRIMARY KEY (event_id, user_id)
  );
`)

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json())

function checkPassword(req, res, next) {
  if (req.headers['x-password'] !== PASSWORD) {
    return res.status(401).json({ error: 'Falsches Passwort' })
  }
  next()
}

app.use('/api', checkPassword)

// ── Profiles ──────────────────────────────────────────────────────────────────
app.get('/api/profiles', (req, res) => {
  const rows = db.prepare('SELECT * FROM profiles ORDER BY name').all()
  res.json(rows)
})

app.post('/api/profiles', (req, res) => {
  const { id, name } = req.body
  if (!id || !name) return res.status(400).json({ error: 'id und name erforderlich' })
  db.prepare(`
    INSERT INTO profiles (id, name, is_online, last_seen)
    VALUES (?, ?, 1, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name      = excluded.name,
      is_online = 1,
      last_seen = datetime('now')
  `).run(id, name)
  res.json({ id, name })
})

app.patch('/api/profiles/:id', (req, res) => {
  const { is_online } = req.body
  db.prepare(`UPDATE profiles SET is_online=?, last_seen=datetime('now') WHERE id=?`)
    .run(is_online ? 1 : 0, req.params.id)
  res.json({ ok: true })
})

// ── Proposals ────────────────────────────────────────────────────────────────
app.get('/api/proposals', (req, res) => {
  const proposals = db.prepare('SELECT * FROM proposals ORDER BY created_at DESC').all()
  const votes     = db.prepare('SELECT * FROM votes').all()
  const profiles  = db.prepare('SELECT id, name FROM profiles').all()

  const result = proposals.map(p => ({
    ...p,
    votes:   votes.filter(v => v.proposal_id === p.id),
    profile: profiles.find(pr => pr.id === p.created_by) || null,
  }))
  res.json(result)
})

app.post('/api/proposals', (req, res) => {
  const { title, description, url, category, image_url, created_by } = req.body
  if (!title || !description) return res.status(400).json({ error: 'Titel und Beschreibung erforderlich' })
  const id = randomUUID()
  db.prepare(`
    INSERT INTO proposals (id, title, description, url, category, image_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description, url || null, category || 'sightseeing', image_url || null, created_by || null)
  res.json({ id, title, description, url, category, image_url, created_by })
})

app.delete('/api/proposals/:id', (req, res) => {
  db.prepare('DELETE FROM votes WHERE proposal_id=?').run(req.params.id)
  db.prepare('DELETE FROM proposals WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Votes ─────────────────────────────────────────────────────────────────────
app.post('/api/votes', (req, res) => {
  const { proposal_id, user_id, vote_type } = req.body
  if (!proposal_id || !user_id || !vote_type) return res.status(400).json({ error: 'Fehlende Felder' })
  const id = randomUUID()
  db.prepare(`
    INSERT INTO votes (id, proposal_id, user_id, vote_type)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(proposal_id, user_id) DO UPDATE SET vote_type = excluded.vote_type
  `).run(id, proposal_id, user_id, vote_type)
  res.json({ ok: true })
})

app.delete('/api/votes', (req, res) => {
  const { proposal_id, user_id } = req.body
  db.prepare('DELETE FROM votes WHERE proposal_id=? AND user_id=?').run(proposal_id, user_id)
  res.json({ ok: true })
})

// ── Calendar events ───────────────────────────────────────────────────────────
app.get('/api/events', (req, res) => {
  const events = db.prepare('SELECT * FROM calendar_events ORDER BY start_date').all()
  const parts  = db.prepare(`
    SELECT ep.event_id, p.id, p.name
    FROM event_participants ep
    JOIN profiles p ON p.id = ep.user_id
  `).all()

  const result = events.map(e => ({
    ...e,
    participants: parts.filter(p => p.event_id === e.id),
  }))
  res.json(result)
})

app.post('/api/events', (req, res) => {
  const { title, description, category, start_date, end_date, all_day, created_by, participants } = req.body
  if (!title || !start_date) return res.status(400).json({ error: 'Titel und Startdatum erforderlich' })
  const id = randomUUID()
  db.prepare(`
    INSERT INTO calendar_events (id, title, description, category, start_date, end_date, all_day, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || null, category || 'allgemein', start_date, end_date || null, all_day ? 1 : 0, created_by || null)

  const insertPart = db.prepare('INSERT OR IGNORE INTO event_participants (event_id, user_id) VALUES (?, ?)')
  ;(participants || []).forEach(uid => insertPart.run(id, uid))

  res.json({ id })
})

app.patch('/api/events/:id', (req, res) => {
  const { title, description, category, start_date, end_date, all_day, participants } = req.body

  if (title !== undefined) {
    db.prepare(`
      UPDATE calendar_events
      SET title=?, description=?, category=?, start_date=?, end_date=?, all_day=?
      WHERE id=?
    `).run(title, description || null, category, start_date, end_date || null, all_day ? 1 : 0, req.params.id)
  } else {
    // Drag & drop – only dates change
    db.prepare('UPDATE calendar_events SET start_date=?, end_date=? WHERE id=?')
      .run(start_date, end_date || start_date, req.params.id)
  }

  if (participants !== undefined) {
    db.prepare('DELETE FROM event_participants WHERE event_id=?').run(req.params.id)
    const insertPart = db.prepare('INSERT OR IGNORE INTO event_participants (event_id, user_id) VALUES (?, ?)')
    ;(participants || []).forEach(uid => insertPart.run(req.params.id, uid))
  }
  res.json({ ok: true })
})

app.delete('/api/events/:id', (req, res) => {
  db.prepare('DELETE FROM event_participants WHERE event_id=?').run(req.params.id)
  db.prepare('DELETE FROM calendar_events WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Serve React app in production ─────────────────────────────────────────────
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`\n🍀  Irland-Reise App läuft auf http://localhost:${PORT}`)
  console.log(`🔑  Passwort: ${PASSWORD}\n`)
})
