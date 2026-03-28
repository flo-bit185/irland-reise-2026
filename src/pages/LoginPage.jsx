import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Bitte deinen Namen eingeben'); return }
    setError('')
    setLoading(true)
    try {
      await login(password, name.trim())
      navigate('/')
    } catch (err) {
      setError(err.message || 'Fehler beim Anmelden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {/* Header */}
        <div className="text-6xl mb-4">🍀</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Irland Reise 2026</h1>
        <p className="text-gray-500 mb-8">Gib das Gruppen-Passwort ein und deinen Namen</p>

        {/* Trip preview */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-semibold text-ireland-green mb-2">🗺️ Unsere Route</h3>
          <div className="flex flex-wrap gap-1 text-sm">
            {['Dublin', 'Cliffs of Moher', 'Galway', 'Ring of Kerry', 'Killarney'].map((stop, i, arr) => (
              <span key={stop} className="flex items-center gap-1">
                <span className="bg-ireland-green text-white px-2 py-0.5 rounded-full text-xs">{stop}</span>
                {i < arr.length - 1 && <span className="text-gray-400">→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dein Name</label>
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Anna oder Max"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ireland-green focus:ring-2 focus:ring-ireland-green/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gruppen-Passwort</label>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ireland-green focus:ring-2 focus:ring-ireland-green/20"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ireland-green text-white rounded-xl py-3 font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Wird überprüft...' : '🚀 Zur Reiseplanung'}
          </button>
        </form>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mt-6 text-left">
          {[
            { icon: '💡', text: 'Vorschläge machen' },
            { icon: '🗳️', text: 'Abstimmen' },
            { icon: '📅', text: 'Kalender planen' },
            { icon: '👥', text: 'Team sehen' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-2 text-sm text-gray-500">
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
