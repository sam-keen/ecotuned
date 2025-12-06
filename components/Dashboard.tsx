'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import type { UserPreferences, SimplifiedWeather } from '@/lib/schemas'
import { fetchPostcodeData, fetchTodayAndTomorrowWeather } from '@/lib/api'
import { generateRecommendations } from '@/lib/recommendations'
import WeatherSummary from './WeatherSummary'
import EditPreferences from './EditPreferences'
import Badge from './Badge'

interface DashboardProps {
  preferences: UserPreferences
  initialData?: {
    postcodeData: {
      latitude: number
      longitude: number
      postcode: string
      region?: string
    }
    weather: {
      today: SimplifiedWeather
      tomorrow: SimplifiedWeather
    }
  }
}

export default function Dashboard({ preferences, initialData }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today')
  const [headerElement, setHeaderElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setHeaderElement(document.getElementById('header-controls'))
  }, [])

  // Use React Query to fetch and cache weather data
  const { data, isLoading, error } = useQuery({
    queryKey: ['weather', preferences.postcode],
    queryFn: async () => {
      // Fetch postcode data
      const postcodeData = await fetchPostcodeData(preferences.postcode)

      // Fetch weather for both days
      const weather = await fetchTodayAndTomorrowWeather(
        postcodeData.latitude,
        postcodeData.longitude
      )

      return {
        postcodeData,
        weather,
      }
    },
    // Use initial data from server if available
    initialData,
    // Data is fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="eco-card p-10 text-center">
          <div className="mb-4 inline-block">
            <Badge>Loading</Badge>
          </div>
          <h2 className="text-2xl font-display font-black text-eco-black uppercase">
            Fetching Weather Data...
          </h2>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="eco-card p-8">
          <Badge>Error</Badge>
          <h2 className="text-3xl font-display font-black text-eco-black mb-4 mt-4 uppercase">
            Unable to Load
          </h2>
          <p className="text-eco-black/90 font-medium mb-6 leading-relaxed">
            {error instanceof Error
              ? error.message
              : 'We encountered an error. Please try again later.'}
          </p>
          <EditPreferences currentPreferences={preferences} />
        </div>
      </div>
    )
  }

  // Generate recommendations for both days
  const todayRecommendations = generateRecommendations(data.weather.today, preferences, true, 'today')
  const tomorrowRecommendations = generateRecommendations(data.weather.tomorrow, preferences, false, 'tomorrow')

  // Sort today's recommendations to put passed ones at the bottom
  const sortedTodayRecommendations = [...todayRecommendations].sort((a, b) => {
    if (a.timeStatus === 'passed' && b.timeStatus !== 'passed') return 1
    if (a.timeStatus !== 'passed' && b.timeStatus === 'passed') return -1
    return 0
  })

  return (
    <div>
      {headerElement && createPortal(
        <div className="grid grid-cols-[1fr_auto] gap-6 items-center">
          {/* Column 1: Location and preferences stacked */}
          <div className="flex flex-col gap-1">
            {/* Location with bullet separator */}
            <div className="text-sm">
              <span className="font-black text-eco-black uppercase">
                {data.postcodeData.postcode}
              </span>
              {data.postcodeData.region && (
                <>
                  <span className="mx-2 text-eco-black/60">•</span>
                  <span className="font-medium text-eco-black/90">
                    {data.postcodeData.region}
                  </span>
                </>
              )}
            </div>

            {/* Preferences */}
            {(preferences.hasGarden || preferences.hasEV || preferences.cycleToWork || preferences.hasSolar) && (
              <div className="text-xs font-medium">
                Showing tips for{' '}
                {[
                  preferences.hasGarden && 'gardens',
                  preferences.hasEV && 'EV',
                  preferences.cycleToWork && 'cycling',
                  preferences.hasSolar && 'solar'
                ].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1')}
              </div>
            )}
          </div>

          {/* Column 2: Edit button */}
          <EditPreferences currentPreferences={preferences} />
        </div>,
        headerElement
      )}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Tabs */}
        <div className="flex gap-4 border-b-4 border-eco-mint">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-6 py-3 font-display font-black uppercase tracking-tight text-xl transition-all ${
              activeTab === 'today'
                ? 'bg-eco-mint border-3 border-eco-mint text-eco-black'
                : 'bg-eco-white border-3 border-eco-border text-eco-black/60 hover:text-eco-black'
            } rounded-t-lg border-3`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('tomorrow')}
            className={`px-6 py-3 font-display font-black uppercase tracking-tight text-xl transition-all ${
              activeTab === 'tomorrow'
                  ? 'bg-eco-mint border-3 border-eco-mint text-eco-black'
                : 'bg-eco-white border-3 border-eco-border text-eco-black/60 hover:text-eco-black'
            } rounded-t-lg border-3`}
          >
            Tomorrow
          </button>
        </div>

        {/* Today's Section */}
        {activeTab === 'today' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Today's Tips */}
              <div className="lg:col-span-8 space-y-6">
                {sortedTodayRecommendations.length === 0 ? (
                  <div className="eco-card p-8 text-center bg-gradient-to-br from-eco-mint/10 to-eco-sky/10">
                    <div className="mb-4 inline-block">
                      <Badge>All Clear</Badge>
                    </div>
                    <h3 className="text-2xl font-display font-black text-eco-black uppercase mb-3">
                      No Tips for Today
                    </h3>
                    <p className="text-eco-black/80 font-medium leading-relaxed">
                      Based on today's weather and your setup, we don't have any specific energy-saving recommendations.
                      Check back tomorrow or adjust your preferences if you'd like more tips!
                    </p>
                  </div>
                ) : (
                  sortedTodayRecommendations.map((tip, index) => {
                    const isPassed = tip.timeStatus === 'passed'

                    return (
                      <div
                        key={tip.id}
                        className={`eco-card p-6 relative overflow-hidden ${isPassed ? 'opacity-50' : ''}`}
                      >
                        <div className="relative z-10">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <Badge>
                              {index === 0 ? '#1 Priority' : `${tip.priority}`}
                            </Badge>
                            {tip.savingsEstimate && (
                              <Badge>
                                {tip.savingsEstimate}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-2xl font-display font-black mb-3 uppercase tracking-tight text-eco-black">
                            {tip.title}
                            {isPassed && (
                              <span className="ml-2 text-sm font-medium opacity-60">⏰</span>
                            )}
                          </h3>
                          <p className="font-medium mb-3 leading-relaxed text-eco-black">
                            {tip.description}
                          </p>
                          <p className="text-sm font-medium text-eco-black/70">
                            Why: {tip.reasoning}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Today's Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-eco-peach/30 border-3 border-eco-sunset rounded-xl shadow-[8px_8px_0px_#FFB88C] p-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <Badge color="azure">Today</Badge>
                    <h3 className="text-xl font-display font-black uppercase mb-4 mt-4 text-eco-black">
                      Weather
                    </h3>
                    <WeatherSummary weather={data.weather.today} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tomorrow's Section */}
        {activeTab === 'tomorrow' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Tomorrow's Tips */}
              <div className="lg:col-span-8 space-y-6">
                {tomorrowRecommendations.length === 0 ? (
                  <div className="eco-card p-8 text-center bg-gradient-to-br from-eco-sky/10 to-eco-azure/10">
                    <div className="mb-4 inline-block">
                      <Badge>All Clear</Badge>
                    </div>
                    <h3 className="text-2xl font-display font-black text-eco-black uppercase mb-3">
                      No Tips for Tomorrow
                    </h3>
                    <p className="text-eco-black/80 font-medium leading-relaxed">
                      Based on tomorrow's forecast and your setup, we don't have any specific energy-saving recommendations.
                      Check back later or adjust your preferences if you'd like more tips!
                    </p>
                  </div>
                ) : (
                  tomorrowRecommendations.map((tip, index) => {
                    return (
                      <div
                        key={tip.id}
                        className="eco-card p-6 relative overflow-hidden"
                      >
                        <div className="relative z-10">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <Badge>
                              {index === 0 ? '#1 Priority' : `${tip.priority}`}
                            </Badge>
                            {tip.savingsEstimate && (
                              <Badge>
                                {tip.savingsEstimate}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-2xl font-display font-black mb-3 uppercase tracking-tight text-eco-black">
                            {tip.title}
                          </h3>
                          <p className="font-medium mb-3 leading-relaxed text-eco-black">
                            {tip.description}
                          </p>
                          <p className="text-sm font-medium text-eco-black/70">
                            Why: {tip.reasoning}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Tomorrow's Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                {/* Tomorrow's Weather Card */}
                <div className="bg-eco-peach/30 border-3 border-eco-sunset rounded-xl shadow-[8px_8px_0px_#FFB88C] p-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <Badge color="sky">Tomorrow</Badge>
                    <h3 className="text-xl font-display font-black uppercase mb-4 mt-4 text-eco-black">
                      Weather
                    </h3>
                    <WeatherSummary weather={data.weather.tomorrow} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
