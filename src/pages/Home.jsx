import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Ireland route waypoints
const ROUTE = [
  { name: 'Dublin', lat: 53.3498, lng: -6.2603, emoji: '🏙️', desc: 'Start der Reise – Hauptstadt Irlands' },
  { name: 'Cliffs of Moher', lat: 52.9715, lng: -9.4309, emoji: '🏔️', desc: 'Dramatische 200m hohe Klippen' },
  { name: 'Galway', lat: 53.2707, lng: -9.0568, emoji: '🎵', desc: 'Bunte Stadt mit lebhafter Musikszene' },
  { name: 'Ring of Kerry', lat: 51.9680, lng: -9.9357, emoji: '🌊', desc: 'Spektakuläre Küstenstraße' },
  { name: 'Killarney', lat: 52.0599, lng: -9.5044, emoji: '🏞️', desc: 'Nationalpark & Endziel' },
]

const routePositions = ROUTE.map(p => [p.lat, p.lng])

function createColorIcon(color, emoji) {
  return L.divIcon({
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
    className: '',
  })
}

function MapFitBounds() {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(routePositions, { padding: [40, 40] })
  }, [map])
  return null
}

export default function Home() {
  const { user, profile } = useAuth()
  const [participants, setParticipants] = useState([])
  const [stats, setStats] = useState({ proposals: 0, events: 0, votes: 0 })

  useEffect(() => {
    fetchParticipants()
    fetchStats()

    // Realtime subscription for online status
    const channel = supabase
      .channel('profiles-online')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchParticipants()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchParticipants() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('name')
    setParticipants(data || [])
  }

  async function fetchStats() {
    const [{ count: proposals }, { count: events }, { count: votes }] = await Promise.all([
      supabase.from('proposals').select('*', { count: 'exact', head: true }),
      supabase.from('calendar_events').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
    ])
    setStats({ proposals: proposals || 0, events: events || 0, votes: votes || 0 })
  }

  const onlineCount = participants.filter(p => p.is_online).length

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-ireland-green to-emerald-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">🍀 Irland Gruppenreise 2026</h1>
        <p className="opacity-90 text-sm">Dublin → Cliffs of Moher → Galway → Ring of Kerry → Killarney</p>
        <div className="flex gap-4 mt-4 text-sm">
          <div className="bg-white/20 rounded-lg px-3 py-1.5">
            <span className="font-bold">{stats.proposals}</span> Vorschläge
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-1.5">
            <span className="font-bold">{stats.events}</span> Events
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-1.5">
            <span className="font-bold">{stats.votes}</span> Stimmen
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-1.5">
            <span className="inline-block w-2 h-2 bg-green-300 rounded-full animate-pulse mr-1"></span>
            <span className="font-bold">{onlineCount}</span> online
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">🗺️ Reiseroute</h2>
            </div>
            <div style={{ height: '420px' }}>
              <MapContainer
                center={[52.8, -8.0]}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapFitBounds />

                {/* Route line */}
                <Polyline
                  positions={routePositions}
                  color="#169B62"
                  weight={4}
                  opacity={0.8}
                  dashArray="10, 5"
                />

                {/* Waypoint markers */}
                {ROUTE.map((stop, i) => (
                  <Marker
                    key={stop.name}
                    position={[stop.lat, stop.lng]}
                    icon={createColorIcon(i === 0 ? '#169B62' : i === ROUTE.length - 1 ? '#FF883E' : '#3b82f6', stop.emoji)}
                  >
                    <Popup>
                      <div className="text-center min-w-[140px]">
                        <div className="text-2xl mb-1">{stop.emoji}</div>
                        <div className="font-bold text-gray-800">{stop.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{stop.desc}</div>
                        <div className="text-xs text-ireland-green mt-1">Stop {i + 1} von {ROUTE.length}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Route stops */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {ROUTE.map((stop, i) => (
                  <div key={stop.name} className="flex items-center gap-1">
                    <span className="text-sm">{stop.emoji}</span>
                    <span className="text-sm font-medium text-gray-700">{stop.name}</span>
                    {i < ROUTE.length - 1 && <span className="text-gray-300 mx-1">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-4">
              👥 Teilnehmer
              {onlineCount > 0 && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {onlineCount} online
                </span>
              )}
            </h2>

            {participants.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">👋</div>
                <p className="text-sm">Noch keine Teilnehmer angemeldet</p>
                {!user && (
                  <a href="/login" className="text-ireland-green text-sm font-medium mt-2 block hover:underline">
                    Jetzt anmelden →
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.email}&backgroundColor=b6e3f4`}
                        alt={p.name || p.email}
                        className="w-10 h-10 rounded-full border-2 border-gray-200 bg-gray-100"
                        onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${p.name || p.email}` }}
                      />
                      {p.is_online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-800 truncate">
                        {p.name || p.email?.split('@')[0]}
                      </div>
                      <div className="text-xs text-gray-400">
                        {p.is_online ? (
                          <span className="text-green-600 font-medium">● Online</span>
                        ) : p.last_seen ? (
                          `Zuletzt aktiv: ${new Date(p.last_seen).toLocaleDateString('de-DE')}`
                        ) : 'Offline'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3">🚀 Schnellzugriff</h3>
            <div className="space-y-2">
              {[
                { icon: '💡', label: 'Neuer Vorschlag', href: '/vorschlaege' },
                { icon: '📅', label: 'Kalender öffnen', href: '/kalender' },
                { icon: '🗳️', label: 'Abstimmen', href: '/abstimmung' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                  <span className="ml-auto text-gray-400">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
