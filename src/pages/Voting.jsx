import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = [
  { value: 'sightseeing', label: 'Sightseeing',    icon: '🏛️' },
  { value: 'essen',       label: 'Essen & Trinken', icon: '🍺' },
  { value: 'aktivitaet',  label: 'Aktivität',      icon: '🧗' },
  { value: 'unterkunft',  label: 'Unterkunft',     icon: '🏨' },
  { value: 'transport',   label: 'Transport',      icon: '🚌' },
]

export default function Voting() {
  const { user } = useAuth()
  const [proposals, setProposals]       = useState([])
  const [participants, setParticipants] = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeCategory, setActiveCategory] = useState('alle')

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 10000)
    return () => clearInterval(id)
  }, [])

  async function fetchData() {
    try {
      const [p, pr] = await Promise.all([
        api.get('/api/proposals'),
        api.get('/api/profiles'),
      ])
      setProposals(p)
      setParticipants(pr)
    } catch { }
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
    fetchData()
  }

  function getMyVote(proposalId) {
    if (!user) return null
    const p = proposals.find(pr => pr.id === proposalId)
    const v = (p?.votes || []).find(v => v.user_id === user.id)
    return v?.vote_type || null
  }

  function getStats(proposal) {
    const votes = proposal.votes || []
    const up    = votes.filter(v => v.vote_type === 'up').length
    const down  = votes.filter(v => v.vote_type === 'down').length
    const total = up + down
    return { up, down, total, score: up - down, percent: total > 0 ? Math.round((up / total) * 100) : 0 }
  }

  const sorted = [...proposals].sort((a, b) => getStats(b).score - getStats(a).score)
  const filtered = activeCategory === 'alle'
    ? sorted
    : sorted.filter(p => p.category === activeCategory)

  const winner = sorted[0]

  if (loading) {
    return <div className="text-center py-16"><div className="text-4xl animate-spin">🍀</div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🗳️ Abstimmung</h1>
        <p className="text-gray-500 text-sm mt-1">Stimme für deine Lieblingsvorschläge ab – Live-Ergebnisse!</p>
      </div>

      {/* Winner banner */}
      {winner && getStats(winner).score > 0 && (
        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div>
              <div className="text-xs font-medium opacity-80">Aktueller Spitzenreiter</div>
              <div className="font-bold text-lg">{winner.title}</div>
              <div className="text-sm opacity-90">
                {getStats(winner).score} Punkte · {getStats(winner).up} 👍 · {getStats(winner).down} 👎
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: proposals.length, label: 'Vorschläge', color: 'text-ireland-green' },
          { value: proposals.reduce((n, p) => n + (p.votes?.length || 0), 0), label: 'Stimmen', color: 'text-blue-500' },
          { value: participants.length, label: 'Teilnehmer', color: 'text-purple-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setActiveCategory('alle')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${activeCategory === 'alle' ? 'bg-ireland-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-ireland-green'}`}>
          🏆 Gesamt-Ranking
        </button>
        {CATEGORIES.filter(c => proposals.some(p => p.category === c.value)).map(cat => (
          <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${activeCategory === cat.value ? 'bg-ireland-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-ireland-green'}`}>
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <div className="text-5xl mb-3">🗳️</div>
          <h3 className="font-semibold text-gray-700">Noch keine Vorschläge</h3>
          <p className="text-gray-400 text-sm mt-1">
            <a href="/vorschlaege" className="text-ireland-green hover:underline">Erstelle einen Vorschlag</a>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((proposal, index) => {
            const stats  = getStats(proposal)
            const myVote = getMyVote(proposal.id)
            const isTop  = index === 0 && activeCategory === 'alle' && stats.score > 0

            return (
              <div key={proposal.id}
                className={`bg-white rounded-2xl shadow-sm p-4 border-2 transition-all ${isTop ? 'border-yellow-400' : 'border-transparent'}`}>
                <div className="flex items-start gap-3">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 text-center pt-1">
                    {isTop ? <span className="text-xl">🏆</span> : <span className="text-lg font-bold text-gray-300">#{index + 1}</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{proposal.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{proposal.description}</p>
                      </div>
                      <div className={`flex-shrink-0 text-base font-bold px-2 py-0.5 rounded-lg ${
                        stats.score > 0 ? 'bg-green-100 text-green-700' :
                        stats.score < 0 ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'}`}>
                        {stats.score > 0 ? '+' : ''}{stats.score}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {stats.total > 0 && (
                      <div className="mt-2 mb-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>👍 {stats.up}</span>
                          <span>{stats.percent}% Zustimmung</span>
                          <span>{stats.down} 👎</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-ireland-green rounded-full transition-all duration-500"
                            style={{ width: `${stats.percent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Voter avatars */}
                    {stats.total > 0 && (
                      <div className="flex items-center gap-1 mb-3">
                        <span className="text-xs text-gray-400">{stats.total} Stimme{stats.total !== 1 ? 'n' : ''}</span>
                        <div className="flex -space-x-1">
                          {(proposal.votes || []).slice(0, 6).map(v => {
                            const p = participants.find(pt => pt.id === v.user_id)
                            return p ? (
                              <div key={v.id}
                                title={`${p.name} – ${v.vote_type === 'up' ? '👍' : '👎'}`}
                                className="w-5 h-5 rounded-full bg-ireland-green/20 flex items-center justify-center text-xs font-bold text-ireland-green border border-white">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {/* Vote buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => handleVote(proposal.id, 'up')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          myVote === 'up'
                            ? 'bg-ireland-green text-white shadow-sm scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-ireland-green'}`}>
                        👍 Dafür {stats.up > 0 && <span className="font-bold">{stats.up}</span>}
                      </button>
                      <button onClick={() => handleVote(proposal.id, 'down')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          myVote === 'down'
                            ? 'bg-red-500 text-white shadow-sm scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'}`}>
                        👎 Dagegen {stats.down > 0 && <span className="font-bold">{stats.down}</span>}
                      </button>
                      {myVote && (
                        <span className="text-xs text-gray-400">
                          {myVote === 'up' ? '✅ Du stimmst dafür' : '❌ Du stimmst dagegen'}
                        </span>
                      )}
                    </div>
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
