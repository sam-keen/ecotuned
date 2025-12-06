'use client'

import type { Recommendation } from '@/lib/schemas'

interface RecommendationsListProps {
  recommendations: Recommendation[]
}

export default function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="glass-subtle rounded-2xl p-8 text-center">
        <p className="text-slate-600 leading-relaxed">
          No specific recommendations for tomorrow based on your current setup.
          Check back tomorrow for new suggestions!
        </p>
      </div>
    )
  }

  const [headline, ...bonusTips] = recommendations

  return (
    <div className="space-y-6">
      {/* Headline recommendation */}
      <div className="relative overflow-hidden rounded-3xl shadow-glow-forest group">
        <div className="absolute inset-0 bg-gradient-forest opacity-95"></div>
        <div className="relative z-10 p-8 md:p-10">
          <div className="flex items-start justify-between mb-4">
            <span className="inline-block bg-white/95 text-forest-700 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide shadow-sm">
              Top Tip
            </span>
            {headline.savingsEstimate && (
              <span className="bg-forest-900/30 text-white text-sm font-bold px-4 py-2 rounded-full backdrop-blur-sm">
                {headline.savingsEstimate}
              </span>
            )}
          </div>
          <h3 className="text-4xl font-display font-bold mb-4 text-white drop-shadow-lg tracking-tight">
            {headline.title}
          </h3>
          <p className="text-forest-50 mb-5 text-lg leading-relaxed">
            {headline.description}
          </p>
          <p className="text-forest-100 text-sm italic leading-relaxed">
            {headline.reasoning}
          </p>
        </div>
        {/* Abstract decorative elements */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-10 left-10 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* Bonus tips */}
      {bonusTips.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {bonusTips.map((tip, index) => (
            <div
              key={tip.id}
              className="glass rounded-2xl p-6 hover:shadow-soft transition-all duration-300 hover:scale-[1.02] group animate-slide-up relative overflow-hidden"
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
            >
              {/* Abstract decorative shape */}
              <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 ${
                tip.priority === 'high'
                  ? 'bg-gradient-dawn'
                  : tip.priority === 'medium'
                  ? 'bg-gradient-ocean'
                  : 'bg-gradient-aurora'
              }`}></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${
                      tip.priority === 'high'
                        ? 'bg-gradient-dawn text-white'
                        : tip.priority === 'medium'
                        ? 'bg-gradient-ocean text-white'
                        : 'bg-gradient-aurora text-white'
                    }`}
                  >
                    {tip.priority}
                  </span>
                  {tip.savingsEstimate && (
                    <span className="text-forest-600 text-xs font-bold bg-forest-50 px-3 py-1.5 rounded-full">
                      {tip.savingsEstimate}
                    </span>
                  )}
                </div>
                <h4 className="font-display font-bold text-slate-800 mb-2 text-xl group-hover:text-ocean-600 transition-colors tracking-tight">
                  {tip.title}
                </h4>
                <p className="text-slate-600 text-sm mb-3 leading-relaxed">
                  {tip.description}
                </p>
                <p className="text-slate-500 text-xs italic leading-relaxed">
                  {tip.reasoning}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
