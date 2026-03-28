import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

function getUserId() {
  let id = localStorage.getItem('user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('user_id', id)
  }
  return id
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)   // { id, name }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pw   = localStorage.getItem('app_password')
    const name = localStorage.getItem('user_name')
    if (pw && name) {
      const id = getUserId()
      const u  = { id, name }
      setUser(u)
      api.post('/api/profiles', u).catch(() => {})
    }
    setLoading(false)
  }, [])

  // Mark offline on page close
  useEffect(() => {
    if (!user) return
    const handleUnload = () => {
      navigator.sendBeacon &&
        navigator.sendBeacon('/api/profiles/' + user.id + '/offline')
      // best-effort – beacon may not carry custom headers; the online
      // indicator resets via last_seen anyway
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [user])

  async function login(password, name) {
    localStorage.setItem('app_password', password)
    // Validate password by hitting the API
    try {
      await api.get('/api/profiles')
    } catch (err) {
      localStorage.removeItem('app_password')
      if (err.status === 401) throw new Error('Falsches Passwort')
      throw err
    }

    const id = getUserId()
    localStorage.setItem('user_name', name)
    const u = { id, name }
    await api.post('/api/profiles', u)
    setUser(u)
  }

  async function signOut() {
    if (user) {
      await api.patch('/api/profiles/' + user.id, { is_online: false }).catch(() => {})
    }
    localStorage.removeItem('app_password')
    localStorage.removeItem('user_name')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
