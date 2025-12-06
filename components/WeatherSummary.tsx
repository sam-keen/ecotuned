'use client'

import type { SimplifiedWeather } from '@/lib/schemas'

interface WeatherSummaryProps {
  weather: SimplifiedWeather
}

export default function WeatherSummary({ weather }: WeatherSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Temperature */}
      <div className="border-2 border-eco-coral/60 bg-eco-white/80 backdrop-blur-sm p-3 rounded-lg">
        <div className="text-3xl font-display font-black text-eco-black">
          {weather.tempHigh}°C
        </div>
        <div className="text-xs font-bold text-eco-black/70 uppercase">
          High (Low: {weather.tempLow}°C)
        </div>
      </div>

      {/* Conditions */}
      <div className="border-2 border-eco-peach/60 bg-eco-white/80 backdrop-blur-sm p-3 rounded-lg">
        <div className="text-lg font-display font-black text-eco-black uppercase">
          {weather.conditions}
        </div>
        <div className="text-xs font-bold text-eco-black/70">
          {weather.cloudCoveragePercent}% clouds
        </div>
      </div>

      {/* Wind & Rain Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border-2 border-eco-sunset/60 bg-eco-white/80 backdrop-blur-sm p-3 rounded-lg">
          <div className="text-2xl font-display font-black text-eco-black">
            {weather.windSpeedMph}
          </div>
          <div className="text-xs font-bold text-eco-black/70 uppercase">mph wind</div>
        </div>

        <div className="border-2 border-eco-rose/60 bg-eco-white/80 backdrop-blur-sm p-3 rounded-lg">
          <div className="text-2xl font-display font-black text-eco-black">
            {weather.rainProbability}%
          </div>
          <div className="text-xs font-bold text-eco-black/70 uppercase">rain</div>
        </div>
      </div>

      {/* Sunny hours */}
      {weather.sunnyHours > 0 && (
        <div className="bg-eco-sunset/50 border-2 border-eco-sunset/60 p-3 rounded-lg">
          <div className="text-sm font-black text-eco-black uppercase">
            ☀️ {weather.sunnyHours}hrs clear skies
          </div>
        </div>
      )}
    </div>
  )
}
