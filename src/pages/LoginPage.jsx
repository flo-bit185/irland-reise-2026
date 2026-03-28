import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {/* Header */}
        <div className="text-6xl mb-4">🍀</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Irland Reise 2026</h1>
        <p className="text-gray-500 mb-8">Melde dich an, um an der Planung teilzunehmen!</p>

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

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-8 text-left">
          {[
            { icon: '💡', text: 'Vorschläge machen' },
            { icon: '🗳️', text: 'Abstimmen' },
            { icon: '📅', text: 'Kalender planen' },
            { icon: '👥', text: 'Live-Updates' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-2 text-sm text-gray-600">
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Google Login Button */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl py-3 px-4 font-medium text-gray-700 hover:border-ireland-green hover:shadow-md transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Mit Google anmelden
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Nur für Mitglieder der Reisegruppe
        </p>
      </div>
    </div>
  )
}
