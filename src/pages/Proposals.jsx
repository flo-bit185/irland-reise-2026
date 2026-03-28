import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = [
  { value: 'sightseeing', label: 'Sightseeing',   icon: '🏛️', color: 'bg-blue-100 text-blue-700'   },
  { value: 'essen',       label: 'Essen & Trinken',icon: '🍺', color: 'bg-yellow-100 text-yellow-700'},
  { value: 'aktivitaet',  label: 'Aktivität',      icon: '🧗', color: 'bg-orange-100 text-orange-700'},
  { value: 'unterkunft',  label: 'Unterkunft',     icon: '🏨', color: 'bg-purple-100 text-purple-700'},
  { value: 'transport',   label: 'Transport',      icon: '🚌', color: 'bg-gray-100 text-gray-700'   },
]

const PLACEHOLDER_IMAGES = {
  sightseeing: 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?w=400&h=200&fit=crop',
  essen:       'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop',
  aktivitaet:  'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=200&fit=crop',
  unterkunft:  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=200&fit=crop',
  transport:   'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop',
}

function getCat(value) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[0]
}

export default function Proposals() {
  const { user } = useAuth()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [filter, setFilter]       = useState('alle')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [form, setForm] = useState({
    title: '', description: '', url: '', category: 'sightseeing', image_url: '',
  })

  useEffect(() => {
    fetchProposals()
    const id = setInterval(fetchProposals, 10000)
    return () => clearInterval(id)
  }, [])

  async function fetchProposals() {
    try {
      const data = await api.get('/api/proposals')
      setProposals(data)
    } catch { /* not authed */ }
    setLoading(false)
  }

  async function handleVote(proposalId, voteType) {
    if (!user) { alert('Bitte zuerst anmelden!'); return }
    const myVote = getMyVote(proposalId)
    if (myVote === voteType) {
      await api.delete('/api/votes', { proposal_id: proposalId, user_id: user.id })
    } else {
      await api.post('/api/votes', { proposal_id: proposalId, user_id: user.id, vote_type: voteType })
    }
    fetchProposals()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) { alert('Bitte zuerst anmelden!'); return }
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/proposals', {
        ...form,
        image_url:  form.image_url || PLACEHOLDER_IMAGES[form.category],
        created_by: user.id,
      })
      setForm({ title: '', description: '', url: '', category: 'sightseeing', image_url: '' })
      setShowForm(false)
      fetchProposals()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function getMyVote(proposalId) {
    if (!user) return null
    const p = proposals.find(pr => pr.id === proposalId)
    const v = (p?.votes || []).find(v => v.user_id === user.id)
    return v?.vote_type || null
  }

  function getScore(proposal) {
    const votes = proposal.votes || []
    return votes.filter(v => v.vote_type === 'up').length - votes.filter(v => v.vote_type === 'down').length
  }

  const filtered = filter === 'alle' ? proposals : proposals.filter(p => p.category === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💡 Vorschläge</h1>
          <p className="text-gray-500 text-sm mt-1">Macht Vorschläge für unsere Irland-Reise</p>
        </div>
        {user ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-ireland-green text-white px-4 py-2 rounded-xl font-medium hover:bg-opacity-90 shadow-sm"
          >
            {showForm ? '✕ Abbrechen' : '+ Vorschlag'}
          </button>
        ) : (
          <a href="/login" className="bg-ireland-green text-white px-4 py-2 rounded-xl font-medium hover:bg-opacity-90">
            Anmelden
          </a>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-ireland-green/20">
          <h2 className="font-semibold text-gray-800 mb-4">Neuer Vorschlag</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  required value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="z.B. Cliffs of Moher Wanderung"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ireland-green focus:ring-1 focus:ring-ireland-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ireland-green"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung *</label>
              <textarea
                required rows={3} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Beschreibe deinen Vorschlag..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ireland-green resize-none"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link (optional)</label>
                <input
                  type="url" value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ireland-green"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bild-URL (optional)</label>
                <input
                  type="url" value={form.image_url}
                  onChange={e => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://... (leer = automatisch)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ireland-green"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Abbrechen
              </button>
              <button type="submit" disabled={submitting}
                className="bg-ireland-green text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50">
                {submitting ? 'Wird gespeichert...' : '💾 Einreichen'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilter('alle')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === 'alle' ? 'bg-ireland-green text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-ireland-green'}`}>
          Alle ({proposals.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = proposals.filter(p => p.category === cat.value).length
          return (
            <button key={cat.value} onClick={() => setFilter(cat.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === cat.value ? 'bg-ireland-green text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-ireland-green'}`}>
              {cat.icon} {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400"><div className="text-4xl animate-spin">🍀</div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <div className="text-5xl mb-3">💡</div>
          <h3 className="font-semibold text-gray-700">Noch keine Vorschläge</h3>
          <p className="text-gray-400 text-sm">Sei der Erste!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...filtered].sort((a, b) => getScore(b) - getScore(a)).map(proposal => {
            const cat      = getCat(proposal.category)
            const upVotes  = (proposal.votes || []).filter(v => v.vote_type === 'up').length
            const downVotes = (proposal.votes || []).filter(v => v.vote_type === 'down').length
            const score    = upVotes - downVotes
            const myVote   = getMyVote(proposal.id)

            return (
              <div key={proposal.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-40 bg-gray-100">
                  <img
                    src={proposal.image_url || PLACEHOLDER_IMAGES[proposal.category]}
                    alt={proposal.title}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.src = PLACEHOLDER_IMAGES[proposal.category] }}
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${cat.color}`}>
                      {cat.icon} {cat.label}
                    </span>
                  </div>
                  {score > 0 && (
                    <div className="absolute top-2 right-2 bg-ireland-green text-white text-xs font-bold px-2 py-1 rounded-full">
                      +{score}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{proposal.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{proposal.description}</p>

                  <div className="flex items-center gap-1 mb-3">
                    <div className="w-5 h-5 rounded-full bg-ireland-green/20 flex items-center justify-center text-xs font-bold text-ireland-green">
                      {(proposal.profile?.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-400">{proposal.profile?.name || 'Anonym'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleVote(proposal.id, 'up')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${myVote === 'up' ? 'bg-ireland-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-ireland-green'}`}>
                      👍 {upVotes}
                    </button>
                    <button onClick={() => handleVote(proposal.id, 'down')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${myVote === 'down' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'}`}>
                      👎 {downVotes}
                    </button>
                    {proposal.url && (
                      <a href={proposal.url} target="_blank" rel="noopener noreferrer"
                        className="ml-auto text-xs text-ireland-green hover:underline">Link →</a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
