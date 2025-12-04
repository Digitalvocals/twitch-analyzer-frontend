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

  // Helper function to create Twitch directory URL
  const getTwitchUrl = (gameName: string) => {
    const slug = gameName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
    return `https://www.twitch.tv/directory/category/${slug}`
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (data) {
      setCountdown(data.cache_expires_in_seconds)
      const timer = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [data])

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
          <button onClick={fetchData} className="matrix-button mt-6">
            RETRY
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-8">
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

        {/* Main Content with Sidebar */}
        <div className="flex gap-8">
          {/* Main Game Grid - Takes up remaining space */}
          <main className="flex-1 min-w-0">
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
                            <div className="text-sm text-matrix-green-dim">
                              {game.viewers.toLocaleString()} viewers • {game.channels} channels
                            </div>
                          </div>
                        </div>

                        {/* Purchase Links */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {/* Twitch Directory Link */}
                          <a
                            href={getTwitchUrl(game.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="matrix-button-small bg-purple-600 hover:bg-purple-700 border-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📺 View on Twitch
                          </a>
                          
                          {game.purchase_links.steam && (
                            <a
                              href={game.purchase_links.steam}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="matrix-button-small"
                              onClick={(e) => e.stopPropagation()}
                            >
                              🎮 Buy on Steam
                            </a>
                          )}
                          {game.purchase_links.epic && (
                            <a
                              href={game.purchase_links.epic}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="matrix-button-small"
                              onClick={(e) => e.stopPropagation()}
                            >
                              🎮 Buy on Epic
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: Score */}
                      <div className="text-right flex-shrink-0">
                        <div className={`text-5xl font-bold ${getScoreColor(game.overall_score)}`}>
                          {game.overall_score.toFixed(2)}
                        </div>
                        <div className="text-xs text-matrix-green-dim mt-1">
                          {game.trend} {game.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedGame?.rank === game.rank && (
                    <div className="mt-4 pt-4 border-t border-matrix-green/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="matrix-stat">
                          <div className="text-matrix-green-dim text-xs">DISCOVERABILITY</div>
                          <div className={`text-2xl font-bold ${getScoreColor(game.discoverability_score)}`}>
                            {game.discoverability_score.toFixed(3)}
                          </div>
                        </div>
                        <div className="matrix-stat">
                          <div className="text-matrix-green-dim text-xs">VIABILITY</div>
                          <div className={`text-2xl font-bold ${getScoreColor(game.viability_score)}`}>
                            {game.viability_score.toFixed(3)}
                          </div>
                        </div>
                        <div className="matrix-stat">
                          <div className="text-matrix-green-dim text-xs">ENGAGEMENT</div>
                          <div className={`text-2xl font-bold ${getScoreColor(game.engagement_score)}`}>
                            {game.engagement_score.toFixed(3)}
                          </div>
                        </div>
                        <div className="matrix-stat">
                          <div className="text-matrix-green-dim text-xs">AVG VIEWERS/CHANNEL</div>
                          <div className="text-2xl font-bold text-matrix-green">
                            {game.avg_viewers_per_channel.toFixed(1)}
                          </div>
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

          {/* Right Sidebar - Desktop Only */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              {/* Ad Space 1 - 300x250 */}
              <div className="border-2 border-matrix-green/50 rounded-lg p-4 bg-black/50">
                <div className="text-center text-matrix-green-dim text-sm mb-2">
                  [ ADVERTISEMENT ]
                </div>
                <div className="w-full h-64 bg-matrix-green/10 rounded flex items-center justify-center border border-matrix-green/30">
                  <div className="text-matrix-green-dim text-xs text-center p-4">
                    Ad Space<br/>300x250
                  </div>
                </div>
              </div>

              {/* Ad Space 2 - 300x600 */}
              <div className="border-2 border-matrix-green/50 rounded-lg p-4 bg-black/50">
                <div className="text-center text-matrix-green-dim text-sm mb-2">
                  [ ADVERTISEMENT ]
                </div>
                <div className="w-full h-[600px] bg-matrix-green/10 rounded flex items-center justify-center border border-matrix-green/30">
                  <div className="text-matrix-green-dim text-xs text-center p-4">
                    Ad Space<br/>300x600
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-matrix-green/30 text-center text-sm text-matrix-green-dim">
          <p>Built by <span className="text-matrix-green font-bold">DIGITALVOCALS</span></p>
          <p className="mt-2">Data updates every 15 minutes • Powered by Twitch API</p>
          <p className="mt-2">
            Affiliate Disclosure: We may earn a commission from game purchases through our links.
          </p>
        </footer>
      </div>
    </div>
  )
}
