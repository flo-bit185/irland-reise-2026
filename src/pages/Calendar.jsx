import { useEffect, useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin   from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin      from '@fullcalendar/list'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const CATEGORY_COLORS = {
  allgemein:  '#169B62',
  sightseeing:'#3b82f6',
  essen:      '#f59e0b',
  aktivitaet: '#f97316',
  unterkunft: '#8b5cf6',
  transport:  '#6b7280',
}

const EVENT_CATEGORIES = [
  { value: 'allgemein',   label: 'Allgemein',      icon: '📌' },
  { value: 'sightseeing', label: 'Sightseeing',    icon: '🏛️' },
  { value: 'essen',       label: 'Essen & Trinken', icon: '🍺' },
  { value: 'aktivitaet',  label: 'Aktivität',      icon: '🧗' },
  { value: 'unterkunft',  label: 'Unterkunft',     icon: '🏨' },
  { value: 'transport',   label: 'Transport',      icon: '🚌' },
]

const EMPTY_FORM = {
  title: '', description: '', category: 'allgemein',
  start: '', end: '', allDay: true, participants: [],
}

export default function Calendar() {
  const { user } = useAuth()
  const [events, setEvents]           = useState([])
  const [participants, setParticipants] = useState([])
  const [showModal, setShowModal]     = useState(false)
  const [editingId, setEditingId]     = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const calRef = useRef(null)

  useEffect(() => {
    fetchEvents()
    fetchParticipants()
    const id = setInterval(fetchEvents, 15000)
    return () => clearInterval(id)
  }, [])

  async function fetchEvents() {
    try {
      const data = await api.get('/api/events')
      setEvents(data.map(e => ({
        id:              e.id,
        title:           e.title,
        start:           e.start_date,
        end:             e.end_date || e.start_date,
        allDay:          !!e.all_day,
        backgroundColor: CATEGORY_COLORS[e.category] || CATEGORY_COLORS.allgemein,
        borderColor:     CATEGORY_COLORS[e.category] || CATEGORY_COLORS.allgemein,
        extendedProps: {
          description:  e.description,
          category:     e.category,
          participants: e.participants || [],
        },
      })))
    } catch { /* not authed */ }
  }

  async function fetchParticipants() {
    try {
      const data = await api.get('/api/profiles')
      setParticipants(data)
    } catch { }
  }

  function openNew(dateStr) {
    if (!user) { alert('Bitte zuerst anmelden!'); return }
    setEditingId(null)
    setForm({ ...EMPTY_FORM, start: dateStr, end: dateStr })
    setShowModal(true)
  }

  function openEdit(ev) {
    setEditingId(ev.id)
    setForm({
      title:        ev.title,
      description:  ev.extendedProps.description || '',
      category:     ev.extendedProps.category || 'allgemein',
      start:        ev.startStr?.substring(0, 10) || '',
      end:          ev.endStr?.substring(0, 10) || ev.startStr?.substring(0, 10) || '',
      allDay:       ev.allDay,
      participants: (ev.extendedProps.participants || []).map(p => p.id),
    })
    setShowModal(true)
  }

  async function handleDrop(info) {
    if (!user) { info.revert(); return }
    try {
      await api.patch('/api/events/' + info.event.id, {
        start_date: info.event.startStr,
        end_date:   info.event.endStr || info.event.startStr,
      })
    } catch { info.revert() }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) return
    const body = {
      title:        form.title,
      description:  form.description,
      category:     form.category,
      start_date:   form.start,
      end_date:     form.end || form.start,
      all_day:      form.allDay,
      created_by:   user.id,
      participants: form.participants,
    }
    if (editingId) {
      await api.patch('/api/events/' + editingId, body)
    } else {
      await api.post('/api/events', body)
    }
    setShowModal(false)
    fetchEvents()
  }

  async function handleDelete() {
    if (!editingId || !confirm('Event wirklich löschen?')) return
    await api.delete('/api/events/' + editingId)
    setShowModal(false)
    fetchEvents()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📅 Reisekalender</h1>
          <p className="text-gray-500 text-sm mt-1">Klicke auf einen Tag um ein Event hinzuzufügen</p>
        </div>
        {user && (
          <button
            onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowModal(true) }}
            className="bg-ireland-green text-white px-4 py-2 rounded-xl font-medium hover:bg-opacity-90 shadow-sm"
          >
            + Event
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {EVENT_CATEGORIES.map(cat => (
          <span key={cat.value} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white border border-gray-200">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CATEGORY_COLORS[cat.value] }}></span>
            {cat.icon} {cat.label}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 overflow-hidden">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          initialDate="2026-06-01"
          locale="de"
          headerToolbar={{
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,listMonth',
          }}
          buttonText={{ today: 'Heute', month: 'Monat', list: 'Liste' }}
          events={events}
          editable={!!user}
          selectable={!!user}
          dateClick={info => openNew(info.dateStr)}
          eventClick={info => openEdit(info.event)}
          eventDrop={handleDrop}
          eventDisplay="block"
          dayMaxEvents={3}
          height="auto"
          firstDay={1}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {editingId ? '✏️ Event bearbeiten' : '+ Neues Event'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                  <input
                    required value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="z.B. Cliffs of Moher Besuch"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ireland-green focus:ring-1 focus:ring-ireland-green"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum *</label>
                    <input required type="date" value={form.start}
                      onChange={e => setForm({ ...form, start: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ireland-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum</label>
                    <input type="date" value={form.end} min={form.start}
                      onChange={e => setForm({ ...form, end: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ireland-green"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ireland-green">
                    {EVENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                  <textarea rows={2} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Details..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ireland-green resize-none"
                  />
                </div>

                {participants.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wer macht mit?</label>
                    <div className="flex flex-wrap gap-2">
                      {participants.map(p => (
                        <button key={p.id} type="button"
                          onClick={() => {
                            const ids = form.participants.includes(p.id)
                              ? form.participants.filter(id => id !== p.id)
                              : [...form.participants, p.id]
                            setForm({ ...form, participants: ids })
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            form.participants.includes(p.id)
                              ? 'bg-ireland-green text-white border-ireland-green'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-ireland-green'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-ireland-green/20 flex items-center justify-center text-xs font-bold text-ireland-green">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {editingId && (
                    <button type="button" onClick={handleDelete}
                      className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100">
                      🗑️ Löschen
                    </button>
                  )}
                  <div className="ml-auto flex gap-2">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                      Abbrechen
                    </button>
                    <button type="submit"
                      className="bg-ireland-green text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90">
                      {editingId ? 'Speichern' : 'Hinzufügen'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
