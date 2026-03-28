import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Home       from './pages/Home'
import Proposals  from './pages/Proposals'
import Calendar   from './pages/Calendar'
import Voting     from './pages/Voting'
import LoginPage  from './pages/LoginPage'

function NavBar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍀</span>
            <span className="font-bold text-ireland-green text-lg hidden sm:block">
              Irland 2026
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {[
              { to: '/',            label: 'Karte',      icon: '🗺️' },
              { to: '/vorschlaege', label: 'Vorschläge', icon: '💡' },
              { to: '/kalender',    label: 'Kalender',   icon: '📅' },
              { to: '/abstimmung',  label: 'Abstimmung', icon: '🗳️' },
            ].map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-ireland-green text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                {icon} <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </div>

          {/* User */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-ireland-green/20 flex items-center justify-center text-sm font-bold text-ireland-green">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 hidden sm:block font-medium">{user.name}</span>
              <button
                onClick={signOut}
                className="text-xs text-gray-400 hover:text-gray-600 hidden sm:block ml-1"
              >
                Abmelden
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="bg-ireland-green text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-opacity-90"
            >
              Anmelden
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  )
}

function AppContent() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🍀</div>
          <p className="text-gray-500">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/vorschlaege" element={<Proposals />} />
          <Route path="/kalender"    element={<Calendar />} />
          <Route path="/abstimmung"  element={<Voting />} />
          <Route path="/login"       element={<LoginPage />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-gray-400 py-4 mt-8">
        🍀 Irland Gruppenreise 2026 – viel Spaß beim Planen!
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
