'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface GameOpportunity {
  rank: number
  name: string
  viewers: number
  channels: number
  avg_viewers_per_channel: number
  discoverability_score: number
  viability_score: number
  engagement_score: number
  overall_score: number
  recommendation: string
  trend: string
  box_art_url: string | null
  purchase_links: {
    steam: string | null
    epic: string | null
    free: boolean
  }
}

interface AnalysisData {
  timestamp: string
  total_games_analyzed: number
  top_opportunities: GameOpportunity[]
  cache_expires_in_seconds: number
  next_update: string
}

export default function Home() {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<GameOpportunity | null>(null)
  const [countdown, setCountdown] = useState<number>(0)

  useEffect(() => {
    fetchData()
    // Refresh every 15 minutes
    const interval = setInterval(fetchData, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!data) return

    // Set initial countdown
    setCountdown(data.cache_expires_in_seconds)

    // Update countdown every second
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData() // Auto-refresh when countdown hits 0
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [data?.timestamp]) // Reset when new data arrives

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/v1/analyze?limit=75`)
      setData(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load data. Please try again later.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.80) return 'score-excellent'
    if (score >= 0.65) return 'score-good'
    if (score >= 0.50) return 'score-moderate'
    return 'score-poor'
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-glow">[ LOADING ]</div>
          <div className="text-matrix-green-dim">Analyzing Twitch data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="matrix-card max-w-md text-center">
          <div className="text-3xl mb-4">❌ ERROR</div>
          <div className="text-matrix-green-dim">{error}</div>
          <button 
            onClick={fetchData}
            className="matrix-button mt-6"
          >
            RETRY
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-glow">
          [ TWITCH STREAMING OPPORTUNITIES ]
        </h1>
        <p className="text-xl text-matrix-green-dim mb-6">
          Find the BEST games to stream RIGHT NOW • Real-time analysis • Top 75 Games
        </p>
        
        {data && (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="matrix-badge">
              🎮 {data.total_games_analyzed} GAMES ANALYZED
            </div>
            <div className="matrix-badge">
              ⏱️ UPDATED: {new Date(data.timestamp).toLocaleTimeString()}
            </div>
            <div className="matrix-badge">
              🔄 NEXT UPDATE: {formatCountdown(countdown)}
            </div>
          </div>
        )}
      </header>

      {/* Game Grid */}
      <main className="max-w-7xl mx-auto">
        <div className="grid gap-4">
          {data?.top_opportunities.map((game) => (
            <div 
              key={game.rank} 
              className="matrix-card cursor-pointer"
              onClick={() => setSelectedGame(selectedGame?.rank === game.rank ? null : game)}
            >
              <div className="flex items-start gap-4">
                {/* Game Cover Image */}
                {game.box_art_url && (
                  <div className="flex-shrink-0">
                    <img 
                      src={game.box_art_url} 
                      alt={game.name}
                      className="w-32 h-44 object-cover rounded border-2 border-matrix-green/50"
                      onError={(e) => {
                        // Hide image if it fails to load
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                
                {/* Main Content */}
                <div className="flex-1 flex items-start justify-between gap-4">
                  {/* Left: Rank & Game Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-4xl font-bold text-matrix-green-bright">
                        #{game.rank}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{game.name}</h2>
                        <div className="text-sm text-matrix-green-dim mt-1">
                          👁 {game.viewers.toLocaleString()} viewers • 
                          📺 {game.channels} channels • 
                          📊 {game.avg_viewers_per_channel} avg/ch
                        </div>
                      </div>
                      <div className="text-3xl">{game.trend}</div>
                    </div>
                    
                    {/* Purchase Links */}
                    <div className="flex gap-3 mt-3">
                      {game.purchase_links.free ? (
                        <span className="text-sm font-bold text-matrix-green-bright">
                          ✨ FREE TO PLAY
                        </span>
                      ) : (
                        <>
                          {game.purchase_links.steam && (
                            <a
                              href={game.purchase_links.steam}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm underline hover:text-matrix-green-bright transition-colors"
                            >
                              🎮 Buy on Steam
                            </a>
                          )}
                          {game.purchase_links.epic && (
                            <a
                              href={game.purchase_links.epic}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm underline hover:text-matrix-green-bright transition-colors"
                            >
                              🎮 Buy on Epic
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${getScoreColor(game.overall_score)}`}>
                      {game.overall_score.toFixed(2)}
                    </div>
                    <div className="text-xs text-matrix-green-dim mt-1">SCORE</div>
                    <div className="text-xs mt-2 font-bold">
                      {game.recommendation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedGame?.rank === game.rank && (
                <div className="mt-6 pt-6 border-t border-matrix-green/30">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{game.discoverability_score.toFixed(3)}</div>
                      <div className="text-xs text-matrix-green-dim">DISCOVERABILITY</div>
                      <div className="text-xs mt-1">(45% weight)</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{game.viability_score.toFixed(3)}</div>
                      <div className="text-xs text-matrix-green-dim">VIABILITY</div>
                      <div className="text-xs mt-1">(35% weight)</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{game.engagement_score.toFixed(3)}</div>
                      <div className="text-xs text-matrix-green-dim">ENGAGEMENT</div>
                      <div className="text-xs mt-1">(20% weight)</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-matrix-green-dim text-center">
                    Click card again to collapse
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 pt-8 border-t border-matrix-green/30 text-center text-sm text-matrix-green-dim">
        <p>Built by <span className="text-matrix-green font-bold">DIGITALVOCALS</span></p>
        <p className="mt-2">Data updates every 15 minutes • Powered by Twitch API</p>
        <p className="mt-2">
          Affiliate Disclosure: We may earn a commission from game purchases through our links.
        </p>
      </footer>
    </div>
  )
}
