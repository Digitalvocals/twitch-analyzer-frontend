'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface GameOpportunity {
  rank: number
  game_name: string
  total_viewers: number
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
  cache_expires_in_seconds?: number  // Old field name (backwards compat)
  next_refresh_in_seconds?: number   // New field name
  next_update: string
  is_refreshing?: boolean
}

interface StatusData {
  cache: {
    has_data: boolean
    age_seconds: number | null
    next_refresh_seconds: number
  }
  worker: {
    is_refreshing: boolean
  }
}

export default function Home() {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<GameOpportunity | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [isWarmingUp, setIsWarmingUp] = useState(false)
  const [warmupStatus, setWarmupStatus] = useState<string>('Initializing...')

  // Helper function to create Twitch search URL
  const getTwitchUrl = (gameName: string) => {
    return `https://www.twitch.tv/search?term=${encodeURIComponent(gameName)}`
  }

  // Check status endpoint for warmup progress
  const checkStatus = useCallback(async () => {
    try {
      const response = await axios.get<StatusData>(`${API_URL}/api/v1/status`)
      const status = response.data
      
      if (status.worker.is_refreshing) {
        setWarmupStatus('Fetching stream data from Twitch API...')
      } else if (status.cache.has_data) {
        setWarmupStatus('Data ready!')
        return true // Has data
      } else {
        setWarmupStatus('Waiting for initial data fetch...')
      }
      return false
    } catch (err) {
      setWarmupStatus('Connecting to server...')
      return false
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/v1/analyze?limit=500`)
      
      // Check if warming up (202 status or warming_up status)
      if (response.status === 202 || response.data.status === 'warming_up') {
        setIsWarmingUp(true)
        setData(null)
        return false
      }
      
      setIsWarmingUp(false)
      setData(response.data)
      setError(null)
      
      // Set countdown from whichever field exists
      const refreshSeconds = response.data.next_refresh_in_seconds ?? 
                            response.data.cache_expires_in_seconds ?? 
                            600
      setCountdown(refreshSeconds)
      
      return true
    } catch (err: any) {
      // 202 comes as an error with axios sometimes
      if (err.response?.status === 202 || err.response?.data?.status === 'warming_up') {
        setIsWarmingUp(true)
        setData(null)
        return false
      }
      setError('Failed to load data. Please try again later.')
      console.error(err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Warmup polling - check status every 3 seconds while warming up
  useEffect(() => {
    if (!isWarmingUp) return

    const pollStatus = async () => {
      const hasData = await checkStatus()
      if (hasData) {
        // Data is ready, fetch it
        await fetchData()
      }
    }

    // Start polling
    pollStatus()
    const interval = setInterval(pollStatus, 3000)
    
    return () => clearInterval(interval)
  }, [isWarmingUp, checkStatus, fetchData])

  // Countdown timer
  useEffect(() => {
    if (!data || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Countdown hit 0 - fetch fresh data
          fetchData()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [data, countdown, fetchData])

  // Also poll for updates every 60 seconds (in case countdown drifts)
  useEffect(() => {
    if (!data) return
    
    const interval = setInterval(() => {
      fetchData()
    }, 60 * 1000)
    
    return () => clearInterval(interval)
  }, [data, fetchData])

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

  // Warmup screen
  if (isWarmingUp || (loading && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl sm:text-6xl mb-4 animate-glow">[ WARMING UP ]</div>
          <div className="text-matrix-green-dim mb-4">{warmupStatus}</div>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-matrix-green border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-matrix-green-dim mt-4 text-sm">
            First load takes ~30 seconds. Auto-refreshing...
          </div>
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/streamscout-logo.jpg" 
              alt="StreamScout - Find Your Audience. Grow Your Channel."
              className="w-full max-w-2xl h-auto"
            />
          </div>
          
          {/* What is StreamScout? */}
          <div className="max-w-2xl mx-auto text-center mb-6 px-4">
            <h2 className="text-lg sm:text-xl font-bold text-matrix-green mb-2">What is StreamScout?</h2>
            <p className="text-sm sm:text-base text-matrix-green-dim leading-relaxed">
              Not another "just sort by viewers" tool. Our algorithm weighs discoverability, viability, and engagement metrics to find opportunities most streamers miss.
            </p>
            <p className="text-sm sm:text-base text-matrix-green-dim leading-relaxed mt-2">
              We show you where small streamers can actually compete.
            </p>
            <p className="text-base sm:text-lg font-bold text-matrix-green mt-3">
              No guesswork. Just data.
            </p>
          </div>
          
          {data && (
            <div className="flex flex-wrap justify-center gap-4 text-sm">
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
          {/* Main Game Grid - Full Width */}
          <main className="w-full">
            <div className="grid gap-4">
              {data?.top_opportunities?.map((game) => (
                <div 
                  key={game.rank} 
                  className="matrix-card cursor-pointer"
                  onClick={() => setSelectedGame(selectedGame?.rank === game.rank ? null : game)}
                >
                  {/* Mobile and Desktop Layout */}
                  <div className="flex gap-4">
                    {/* Game Cover Image - Left Side */}
                    {game.box_art_url && (
                      <div className="flex-shrink-0">
                        <img 
                          src={game.box_art_url} 
                          alt={game.game_name}
                          className="w-20 h-28 sm:w-28 sm:h-40 md:w-32 md:h-44 object-cover rounded border-2 border-matrix-green/50"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Content - Right Side */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Header Row: Rank + Title + Score */}
                      <div className="flex items-start gap-2 mb-2">
                        {/* Rank */}
                        <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-matrix-green-bright flex-shrink-0">
                          #{game.rank}
                        </div>
                        
                        {/* Title (flex-grow to push score right) */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-base sm:text-xl md:text-2xl font-bold leading-tight break-words">
                            {game.game_name}
                          </h2>
                          <div className="text-xs sm:text-sm text-matrix-green-dim mt-1">
                            {game.total_viewers?.toLocaleString() || 0} viewers • {game.channels} channels
                          </div>
                        </div>
                        
                        {/* Score - Always Visible */}
                        <div className="text-right flex-shrink-0 ml-2 pr-1">
                          <div className={`text-2xl sm:text-4xl md:text-5xl font-bold leading-none ${getScoreColor(game.overall_score)}`}>
                            {game.overall_score.toFixed(2)}
                          </div>
                          <div className="text-[10px] sm:text-xs text-matrix-green-dim mt-1">
                            {game.trend}
                          </div>
                          <div className="text-[8px] sm:text-[10px] text-matrix-green-dim leading-tight max-w-[80px] sm:max-w-none">
                            {game.recommendation}
                          </div>
                        </div>
                      </div>

                      {/* Purchase Links */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {/* Twitch Directory Link */}
                        <a
                          href={getTwitchUrl(game.game_name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="matrix-button-small bg-purple-600 hover:bg-purple-700 border-purple-500 text-xs sm:text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          📺 Twitch
                        </a>
                        
                        {game.purchase_links.steam && (
                          <a
                            href={game.purchase_links.steam}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="matrix-button-small text-xs sm:text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🎮 Steam
                          </a>
                        )}
                        {game.purchase_links.epic && (
                          <a
                            href={game.purchase_links.epic}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="matrix-button-small text-xs sm:text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🎮 Epic
                          </a>
                        )}
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
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-matrix-green/30 text-center text-sm text-matrix-green-dim">
          <p>Built by <span className="text-matrix-green font-bold">DIGITALVOCALS</span></p>
          <p className="mt-2">Data auto-updates every 10 minutes • Powered by Twitch API</p>
          <p className="mt-2">
            Affiliate Disclosure: We may earn a commission from game purchases through our links.
          </p>
        </footer>
      </div>
    </div>
  )
}
