import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = [
  { value: 'sightseeing', label: 'Sightseeing', icon: '🏛️' },
  { value: 'essen', label: 'Essen & Trinken', icon: '🍺' },
  { value: 'aktivitaet', label: 'Aktivität', icon: '🧗' },
  { value: 'unterkunft', label: 'Unterkunft', icon: '🏨' },
  { value: 'transport', label: 'Transport', icon: '🚌' },
]

export default function Voting() {
  const { user } = useAuth()
  const [proposals, setProposals] = useState([])
  const [userVotes, setUserVotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('alle')
  const [participants, setParticipants] = useState([])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('voting-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, fetchData)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  async function fetchData() {
    const [proposalsRes, participantsRes] = await Promise.all([
      supabase.from('proposals').select(`
        *, profiles:created_by(name, avatar_url, email),
        votes(id, user_id, vote_type)
      `).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
    ])

    setProposals(proposalsRes.data || [])
    setParticipants(participantsRes.data || [])

    if (user) {
      const { data: myVotes } = await supabase
        .from('votes').select('proposal_id, vote_type').eq('user_id', user.id)
      const map = {}
      ;(myVotes || []).forEach(v => { map[v.proposal_id] = v.vote_type })
      setUserVotes(map)
    }
    setLoading(false)
  }

  async function handleVote(proposalId, voteType) {
    if (!user) { alert('Bitte zuerst anmelden!'); return }
    const existing = userVotes[proposalId]

    if (existing === voteType) {
      await supabase.from('votes').delete().eq('proposal_id', proposalId).eq('user_id', user.id)
    } else {
      await supabase.from('votes').upsert({
        proposal_id: proposalId, user_id: user.id, vote_type: voteType
      }, { onConflict: 'proposal_id,user_id' })
    }
    fetchData()
  }

  function getVoteStats(proposal) {
    const votes = proposal.votes || []
    const up = votes.filter(v => v.vote_type === 'up').length
    const down = votes.filter(v => v.vote_type === 'down').length
    const total = up + down
    const score = up - down
    const percent = total > 0 ? Math.round((up / total) * 100) : 0
    return { up, down, total, score, percent }
  }

  const categorized = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = proposals.filter(p => p.category === cat.value)
    return acc
  }, {})

  const allWithVotes = [...proposals].sort((a, b) => {
    const sa = getVoteStats(a).score
    const sb = getVoteStats(b).score
    return sb - sa
  })

  const winner = allWithVotes[0]

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-2 animate-spin">🍀</div>
        <p className="text-gray-400">Lade Abstimmungen...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🗳️ Abstimmung</h1>
        <p className="text-gray-500 text-sm mt-1">
          Stimme für deine Lieblingsvorschläge ab – Live-Ergebnisse für alle!
        </p>
      </div>

      {/* Winner Banner */}
      {winner && getVoteStats(winner).score > 0 && (
        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏆</div>
            <div>
              <div className="text-xs font-medium opacity-80">Aktueller Spitzenreiter</div>
              <div className="font-bold text-lg">{winner.title}</div>
              <div className="text-sm opacity-90">
                {getVoteStats(winner).score} Punkte · {getVoteStats(winner).up} 👍 · {getVoteStats(winner).down} 👎
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-ireland-green">{proposals.length}</div>
          <div className="text-xs text-gray-500">Vorschläge</div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-500">
            {proposals.reduce((sum, p) => sum + (p.votes?.length || 0), 0)}
          </div>
          <div className="text-xs text-gray-500">Stimmen</div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-purple-500">{participants.length}</div>
          <div className="text-xs text-gray-500">Teilnehmer</div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory('alle')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeCategory === 'alle' ? 'bg-ireland-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-ireland-green'
          }`}
        >
          🏆 Gesamt-Ranking
        </button>
        {CATEGORIES.filter(c => (categorized[c.value] || []).length > 0).map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.value ? 'bg-ireland-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-ireland-green'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Voting list */}
      {proposals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <div className="text-5xl mb-3">🗳️</div>
          <h3 className="font-semibold text-gray-700">Noch keine Vorschläge</h3>
          <p className="text-gray-400 text-sm mt-1">
            <a href="/vorschlaege" className="text-ireland-green hover:underline">Erstelle einen Vorschlag</a> um abstimmen zu können
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(activeCategory === 'alle' ? allWithVotes : (categorized[activeCategory] || []).sort((a, b) => getVoteStats(b).score - getVoteStats(a).score))
            .map((proposal, index) => {
              const stats = getVoteStats(proposal)
              const myVote = userVotes[proposal.id]
              const isTop = index === 0 && activeCategory === 'alle' && stats.score > 0

              return (
                <div key={proposal.id}
                  className={`bg-white rounded-2xl shadow-sm p-4 border-2 transition-all ${
                    isTop ? 'border-yellow-400' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 text-center">
                      {isTop ? (
                        <span className="text-xl">🏆</span>
                      ) : (
                        <span className="text-lg font-bold text-gray-300">#{index + 1}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">{proposal.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{proposal.description}</p>
                        </div>
                        <div className={`flex-shrink-0 text-lg font-bold px-2 py-0.5 rounded-lg ${
                          stats.score > 0 ? 'bg-green-100 text-green-700' :
                          stats.score < 0 ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
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

                      {/* Who voted */}
                      {stats.total > 0 && (
                        <div className="flex items-center gap-1 mb-3">
                          <span className="text-xs text-gray-400">{stats.total} Stimme{stats.total !== 1 ? 'n' : ''}</span>
                          <div className="flex -space-x-1">
                            {(proposal.votes || []).slice(0, 5).map(v => {
                              const p = participants.find(pt => pt.id === v.user_id)
                              return p ? (
                                <img
                                  key={v.id}
                                  src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.email}`}
                                  alt={p.name}
                                  title={`${p.name || p.email} – ${v.vote_type === 'up' ? '👍' : '👎'}`}
                                  className="w-5 h-5 rounded-full border border-white bg-gray-100"
                                />
                              ) : null
                            })}
                            {stats.total > 5 && (
                              <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 border border-white">
                                +{stats.total - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Vote buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVote(proposal.id, 'up')}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            myVote === 'up'
                              ? 'bg-ireland-green text-white shadow-sm scale-105'
                              : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-ireland-green'
                          }`}
                        >
                          👍 Dafür {stats.up > 0 && <span className="font-bold">{stats.up}</span>}
                        </button>
                        <button
                          onClick={() => handleVote(proposal.id, 'down')}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            myVote === 'down'
                              ? 'bg-red-500 text-white shadow-sm scale-105'
                              : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                          }`}
                        >
                          👎 Dagegen {stats.down > 0 && <span className="font-bold">{stats.down}</span>}
                        </button>
                        {myVote && (
                          <span className="ml-auto flex items-center text-xs text-gray-400">
                            {myVote === 'up' ? '✅ Du hast dafür gestimmt' : '❌ Du hast dagegen gestimmt'}
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
