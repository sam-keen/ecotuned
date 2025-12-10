'use client'

import type { GridData } from '@/lib/schemas'

interface GridMixProps {
  gridData: GridData
}

export default function GridMix({ gridData }: GridMixProps) {
  // Main categories for the bar chart
  const categories = [
    {
      name: 'Renewables',
      percent: gridData.renewablePercent,
      color: 'bg-eco-mint',
      textColor: 'text-eco-mint',
    },
    {
      name: 'Fossil',
      percent: gridData.fossilPercent,
      color: 'bg-eco-rose',
      textColor: 'text-eco-rose',
    },
    {
      name: 'Nuclear',
      percent: gridData.nuclearPercent,
      color: 'bg-eco-lemon-strong',
      textColor: 'text-eco-lemon-strong',
    },
    {
      name: 'Other',
      percent: gridData.otherPercent,
      color: 'bg-eco-peach',
      textColor: 'text-eco-peach',
    },
  ].filter((cat) => cat.percent > 0)

  // Sort by category first, then by percentage (descending) within each category
  const categoryOrder = { renewable: 1, fossil: 2, nuclear: 3, other: 4 }
  const detailedBreakdown = gridData.fuelBreakdown
    .filter((fuel) => fuel.perc > 0)
    .map((fuel) => ({
      name: fuel.fuel.charAt(0).toUpperCase() + fuel.fuel.slice(1),
      percent: fuel.perc,
      category: fuel.category,
    }))
    .sort((a, b) => {
      const orderA = categoryOrder[a.category as keyof typeof categoryOrder] || 5
      const orderB = categoryOrder[b.category as keyof typeof categoryOrder] || 5
      if (orderA !== orderB) return orderA - orderB
      return b.percent - a.percent
    })

  const getFuelColor = (category: string) => {
    const cat = categories.find((c) => c.name.toLowerCase().includes(category))
    return cat?.textColor || 'text-eco-black'
  }

  return (
    <div>
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-4">
        {/* Label with live indicator */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-display font-black text-eco-black uppercase leading-tight">
              Live Energy Grid
            </div>
            {/* Pulsing live indicator */}
            <div className="relative flex items-center">
              <div className="w-2 h-2 bg-eco-sage rounded-full animate-pulse" />
              <div className="absolute w-2 h-2 bg-eco-sage rounded-full animate-ping opacity-75" />
            </div>
          </div>
          <div className="text-[10px] text-eco-black/80 flex gap-1">
            <span>GB</span> <span>•</span> <span>Updates every 30min</span>
          </div>
        </div>

        {/* Horizontal Bar */}
        <div className="flex-1">
          <div className="flex h-6 rounded-md overflow-hidden">
            {categories.map((category) => (
              <div
                key={category.name}
                className={`${category.color} flex items-center justify-center`}
                style={{ width: `${category.percent}%` }}
              >
                {category.percent > 6 && (
                  <span className="text-xs font-black text-eco-black/90">
                    {category.percent.toFixed(0)}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Detailed legend with individual fuel types */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px]">
            {detailedBreakdown.map((fuel) => (
              <div key={fuel.name} className="flex items-center gap-1.5">
                <span className={`text-base font-black ${getFuelColor(fuel.category)}`}>•</span>
                <span className="font-bold text-eco-black/90">
                  {fuel.name} {fuel.percent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-2">
        {/* Header with live indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xs font-display font-black text-eco-black uppercase leading-tight">
              Live energy grid
            </div>
            <div className="relative flex items-center">
              <div className="w-1.5 h-1.5 bg-eco-sage rounded-full animate-pulse" />
              <div className="absolute w-1.5 h-1.5 bg-eco-sage rounded-full animate-ping opacity-75" />
            </div>
          </div>
          <div className="text-[9px] text-eco-black/50 leading-tight">30min updates</div>
        </div>

        {/* Bar */}
        <div className="flex h-6 rounded-md overflow-hidden">
          {categories.map((category) => (
            <div
              key={category.name}
              className={`${category.color} flex items-center justify-center`}
              style={{ width: `${category.percent}%` }}
            >
              {category.percent > 8 && (
                <span className="text-xs font-black text-eco-black/90">
                  {category.percent.toFixed(0)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Detailed legend with individual fuel types */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[10px]">
          {detailedBreakdown.map((fuel) => (
            <div key={fuel.name} className="flex items-center gap-1">
              <span className={`text-base font-black ${getFuelColor(fuel.category)}`}>•</span>
              <span className="font-bold text-eco-black/70">
                {fuel.name} {fuel.percent.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
