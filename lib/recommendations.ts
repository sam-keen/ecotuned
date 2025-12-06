import type { Recommendation, SimplifiedWeather, UserPreferences } from './schemas'

/**
 * Pure function to generate personalised recommendations
 * Based on weather forecast and user preferences
 *
 * @param weather - Simplified weather data (for today or tomorrow)
 * @param prefs - User preferences (postcode, garden, EV, cycling, solar)
 * @param isToday - Whether this is for today (enables time-aware filtering)
 * @param day - Label for the day ('today' | 'tomorrow') for text generation
 * @returns Array of recommendations, sorted by priority
 */
export function generateRecommendations(
  weather: SimplifiedWeather,
  prefs: UserPreferences,
  isToday: boolean = false,
  day: 'today' | 'tomorrow' = 'tomorrow'
): Recommendation[] {
  const recommendations: Recommendation[] = []

  // Determine if this is a weekend day
  const now = new Date()
  const targetDate = isToday ? now : new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const dayOfWeek = targetDate.getDay() // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // 1. Line-dry laundry recommendation (improved accuracy)
  // Only recommend if user is home during daytime to hang/retrieve washing
  // Assume weekend flexibility - only check availability on weekdays
  const canLineDry = isWeekend
    ? true
    : (prefs.homeWeekdayMorning || prefs.homeWeekdayAfternoon)
  if (prefs.hasGarden && shouldLineDry(weather) && canLineDry) {
    const dryingQuality = getLineDryQuality(weather)
    const windNote = weather.windSpeedMph >= 10 && weather.windSpeedMph <= 18
      ? ' Breezy conditions will help speed up drying - peg items securely.'
      : ''

    recommendations.push({
      id: 'line-dry',
      title: dryingQuality.title,
      description: `${day === 'today' ? 'Today' : 'Tomorrow'} will have ${weather.sunnyHours} hours of clear skies with ${weather.windSpeedMph}mph wind. Hang your washing outside to save energy and money.${windNote}`,
      reasoning: `${dryingQuality.reasoning} with ${weather.cloudCoveragePercent}% cloud coverage and ${weather.rainProbability}% chance of rain.`,
      priority: dryingQuality.priority,
      savingsEstimate: 'Save £0.85-£1.50 per load vs tumble dryer',
      category: 'laundry',
      impact: 'high',
    })
  }

  // 2. EV charging with solar
  // Only recommend if user is home during midday (11am-3pm) to plug in
  // Assume weekend flexibility - only check availability on weekdays
  const canChargeWithSolar = isWeekend ? true : prefs.homeWeekdayAfternoon
  if (prefs.hasEV && prefs.hasSolar && weather.sunnyPeriods.length > 0 && canChargeWithSolar) {
    const bestChargingPeriod = findBestSolarPeriod(weather.sunnyPeriods)
    recommendations.push({
      id: 'ev-solar-charging',
      title: 'Charge your EV during peak solar hours',
      description: `Best charging window: ${bestChargingPeriod.start}-${bestChargingPeriod.end} when your solar panels will generate maximum power.`,
      reasoning: `Clear skies during midday hours with temperatures around ${bestChargingPeriod.temp}°C mean strong solar generation.`,
      priority: 'high',
      savingsEstimate: 'Save £2-£4 per charge vs grid electricity',
      category: 'mobility',
      impact: 'high',
    })
  } else if (prefs.hasEV && !prefs.hasSolar) {
    // EV charging recommendation without solar
    recommendations.push({
      id: 'ev-offpeak-charging',
      title: 'Charge your EV during off-peak hours',
      description: 'Charge overnight (11pm-7am) to take advantage of cheaper electricity rates.',
      reasoning: 'Off-peak electricity is typically 50-70% cheaper than peak rates.',
      priority: 'high',
      savingsEstimate: 'Save £1.50-£3.00 per charge',
      category: 'mobility',
      impact: 'high',
    })
  }

  // 3. Cycling to work (improved wind handling)
  // Only show on weekdays - "cycle to work" implies commuting
  const cyclingConditions = getCyclingConditions(weather)
  if (prefs.cycleToWork && !isWeekend && cyclingConditions.suitable) {
    recommendations.push({
      id: 'cycle-to-work',
      title: cyclingConditions.title,
      description: `${day === 'today' ? 'Today' : 'Tomorrow'} will be ${weather.conditions.toLowerCase()} with temperatures around ${weather.avgTemp}°C and ${weather.rainProbability}% chance of rain.${cyclingConditions.windNote}`,
      reasoning: cyclingConditions.reasoning,
      priority: cyclingConditions.priority,
      savingsEstimate: 'Save £1.50-£5.00 on fuel/public transport',
      category: 'mobility',
      impact: 'high',
    })
  } else if (prefs.cycleToWork && !isWeekend && weather.rainProbability > 70) {
    recommendations.push({
      id: 'no-cycling',
      title: `Heavy rain expected ${day}`,
      description: `${weather.rainProbability}% chance of rain ${day}. If you usually cycle, this might be a good day to take public transport or car-share.`,
      reasoning: 'Heavy rain expected throughout the day.',
      priority: 'low',
      category: 'mobility',
      impact: 'medium',
    })
  }

  // 4. Curtains/blinds for temperature control (NEW - high value)
  if (weather.avgTemp < 10 && weather.tempLow < 5) {
    recommendations.push({
      id: 'curtains-cold',
      title: 'Close curtains at dusk to retain heat',
      description: `Cold night ahead (dropping to ${weather.tempLow}°C). Close curtains and blinds at dusk to prevent heat loss.`,
      reasoning: 'Curtains reduce heating needs by up to 15% with modern double-glazing.',
      priority: 'medium',
      savingsEstimate: 'Save £0.10-£0.20 per day on heating',
      category: 'insulation',
      impact: 'medium',
    })
  } else if (weather.avgTemp >= 22 && weather.sunnyHours >= 4) {
    const isVeryHot = weather.tempHigh >= 26
    recommendations.push({
      id: 'curtains-hot',
      title: isVeryHot ? 'Keep sun-facing blinds closed' : 'Close blinds during hot afternoon',
      description: `${isVeryHot ? 'Hot' : 'Warm'} day ahead (${weather.tempHigh}°C). Close curtains or blinds on sun-facing windows during peak afternoon heat.`,
      reasoning: 'Blocking direct sunlight can reduce indoor temperatures by 7-10°C.',
      priority: 'low',
      savingsEstimate: isVeryHot ? 'Save £0.05-£0.10 on fans' : undefined,
      category: 'insulation',
      impact: 'low',
    })
  }

  // 5. Heating/cooling optimisation (improved with dynamic priority)
  if (weather.avgTemp < 12) {
    const isVeryCold = weather.avgTemp < 5
    recommendations.push({
      id: 'batch-hot-water',
      title: 'Time hot water usage strategically',
      description: `${isVeryCold ? 'Very cold' : 'Cold'} forecast ${day} (${weather.tempLow}-${weather.tempHigh}°C). Schedule showers, baths, and hot water-intensive cleaning for off-peak hours when your heating is on anyway.`,
      reasoning: 'Water heating costs less during off-peak rates, and waste heat from hot water helps warm your home when most needed.',
      priority: 'high',
      savingsEstimate: 'Save £0.30-£0.60 per day',
      category: 'heating',
      impact: 'high',
    })
  } else if (weather.avgTemp >= 14 && weather.avgTemp < 21 && weather.tempLow > 10) {
    recommendations.push({
      id: 'natural-ventilation',
      title: 'Turn off heating, open windows',
      description: `Mild temperatures ${day} (${weather.tempHigh}°C) - ideal conditions for natural ventilation.`,
      reasoning: 'Heating can typically be turned off when outdoor temps reach 14°C.',
      priority: 'high',
      savingsEstimate: 'Save £0.50-£1.50 on heating',
      category: 'heating',
      impact: 'high',
    })
  } else if (weather.avgTemp >= 22 && weather.avgTemp < 26) {
    recommendations.push({
      id: 'avoid-heat-generating',
      title: 'Minimize heat-generating activities',
      description: `Warm ${day === 'today' ? 'weather today' : 'day ahead'} (${weather.tempHigh}°C). Use microwave instead of oven, or cook outdoors.`,
      reasoning: 'An hour of oven use adds 2-3kWh of heat to your home.',
      priority: 'low',
      savingsEstimate: 'Save £0.05-£0.15 on fans',
      category: 'cooking',
      impact: 'low',
    })
  } else if (weather.avgTemp >= 26) {
    recommendations.push({
      id: 'hot-day-cooking',
      title: 'Avoid oven use today',
      description: `Very warm ${day === 'today' ? 'weather today' : 'day ahead'} (${weather.tempHigh}°C). Consider salads, sandwiches, microwave meals, or BBQ.`,
      reasoning: 'Oven heat significantly increases indoor temperature and fan usage.',
      priority: 'low',
      savingsEstimate: 'Save £0.05-£0.15 on fans',
      category: 'cooking',
      impact: 'low',
    })
  }

  // 6. Rainy day batch cooking (energy-focused)
  // Only show on weekends - batch cooking requires extended time at home
  if (isWeekend && weather.rainProbability > 70 && weather.avgTemp < 15) {
    recommendations.push({
      id: 'rainy-day-cooking',
      title: 'Good day for batch cooking',
      description: `Cold and wet ${day} - ideal for batch cooking. Prep multiple meals at once while the oven heat helps warm your home.`,
      reasoning: 'Oven heat reduces heating costs on cold days, and batch cooking 4+ meals saves ~3 hours of oven time over the week.',
      priority: 'medium',
      savingsEstimate: 'Save £0.50-£0.70 per batch session',
      category: 'cooking',
      impact: 'medium',
    })
  }

  // 7. Off-peak appliances (always applicable, weather-independent)
  recommendations.push({
    id: 'off-peak-appliances',
    title: 'Run dishwasher and washing machine overnight',
    description: `Set your dishwasher and washing machine to run during off-peak hours ${day === 'today' ? 'tonight' : 'tomorrow night'} (11pm-7am).`,
    reasoning: 'Off-peak electricity is typically 50-70% cheaper than peak rates.',
    priority: 'medium',
    savingsEstimate: 'Save £0.15-£0.30 per cycle',
    category: 'heating',
    impact: 'medium',
  })

  // Sort by priority (high > medium > low), then by impact
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const impactOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return impactOrder[a.impact || 'medium'] - impactOrder[b.impact || 'medium']
  })

  // Apply category diversity: ensure variety across categories
  const diverseRecs = applyCategoryDiversity(recommendations)

  // Take top 4 recommendations
  const topRecs = diverseRecs.slice(0, 4)

  // Apply time-aware status (only relevant for today)
  const recsWithTimeStatus = applyTimeStatus(topRecs, weather, isToday)

  return recsWithTimeStatus
}

/**
 * Applies category diversity to ensure a good mix of recommendation types
 * Priority: Keep high-impact recs, ensure max 2 from any category, prefer variety
 */
function applyCategoryDiversity(recs: Recommendation[]): Recommendation[] {
  const result: Recommendation[] = []
  const categoryCount: Record<string, number> = {}

  // First pass: Add all high-priority, high-impact recommendations
  for (const rec of recs) {
    if (rec.priority === 'high' && rec.impact === 'high') {
      result.push(rec)
      categoryCount[rec.category || 'other'] = (categoryCount[rec.category || 'other'] || 0) + 1
    }
  }

  // Second pass: Fill remaining slots with diversity
  for (const rec of recs) {
    if (result.includes(rec)) continue // Skip if already added

    const category = rec.category || 'other'
    const count = categoryCount[category] || 0

    // Allow max 2 recommendations per category
    if (count < 2) {
      result.push(rec)
      categoryCount[category] = count + 1
    }
  }

  // If we still have room and low-impact recs to add, fill the gaps
  if (result.length < 4) {
    for (const rec of recs) {
      if (result.includes(rec)) continue
      if (result.length >= 4) break
      result.push(rec)
    }
  }

  return result
}

/**
 * Applies time-aware status to recommendations for today
 * Marks recommendations as 'passed' if their action window has elapsed
 *
 * @param recs - Recommendations to process
 * @param weather - Weather data with sunrise/sunset times
 * @param isToday - If false, all recommendations are marked as 'active'
 * @returns Recommendations with timeStatus applied
 */
function applyTimeStatus(
  recs: Recommendation[],
  weather: SimplifiedWeather,
  isToday: boolean
): Recommendation[] {
  // If this is for tomorrow, everything is active
  if (!isToday) {
    return recs.map(rec => ({ ...rec, timeStatus: 'active' as const }))
  }

  const now = new Date()
  const currentHour = now.getHours()

  // Parse sunset time to get the hour
  const sunsetTime = new Date(weather.sunset)
  const sunsetHour = sunsetTime.getHours()

  return recs.map(rec => {
    let timeStatus: 'active' | 'passed' = 'active'

    // Line-dry: passed if after (sunset - 2 hours)
    if (rec.id === 'line-dry') {
      if (currentHour >= sunsetHour - 2) {
        timeStatus = 'passed'
      }
    }

    // EV solar charging: passed if after 3pm (15:00)
    if (rec.id === 'ev-solar-charging') {
      if (currentHour >= 15) {
        timeStatus = 'passed'
      }
    }

    return { ...rec, timeStatus }
  })
}

/**
 * Determines if weather is suitable for line-drying laundry
 */
function shouldLineDry(weather: SimplifiedWeather): boolean {
  return (
    weather.sunnyHours >= 3 &&
    weather.windSpeedMph < 25 && // Increased threshold - wind helps drying
    weather.rainProbability < 30
  )
}

/**
 * Evaluates line-drying quality and adjusts messaging
 */
function getLineDryQuality(weather: SimplifiedWeather): {
  title: string
  reasoning: string
  priority: 'high' | 'medium'
} {
  const isExceptional = weather.sunnyHours >= 5 && weather.rainProbability < 10
  const isMarginal = weather.rainProbability >= 20 && weather.rainProbability < 30

  if (isExceptional) {
    return {
      title: 'Exceptional day for line-drying',
      reasoning: 'Outstanding drying conditions',
      priority: 'high',
    }
  } else if (isMarginal) {
    return {
      title: 'Decent day for line-drying (with small shower risk)',
      reasoning: 'Good drying conditions with a small chance of showers',
      priority: 'medium',
    }
  } else {
    return {
      title: 'Good day for line-drying',
      reasoning: 'Suitable drying conditions',
      priority: 'high',
    }
  }
}

/**
 * Evaluates cycling conditions with improved wind handling
 */
function getCyclingConditions(weather: SimplifiedWeather): {
  suitable: boolean
  title: string
  reasoning: string
  windNote: string
  priority: 'high' | 'medium'
} {
  const isSuitable =
    weather.rainProbability < 40 &&
    weather.avgTemp > 5 &&
    weather.avgTemp < 28 &&
    weather.windSpeedMph < 20 // Reduced from 25 - more realistic

  if (!isSuitable) {
    return {
      suitable: false,
      title: '',
      reasoning: '',
      windNote: '',
      priority: 'medium',
    }
  }

  // Wind quality assessment
  if (weather.windSpeedMph >= 15) {
    return {
      suitable: true,
      title: 'Decent cycling weather (breezy)',
      reasoning: 'Acceptable conditions though it will be windy.',
      windNote: " It'll be breezy - if you're comfortable with windier rides, it's still manageable.",
      priority: 'medium',
    }
  } else {
    return {
      suitable: true,
      title: 'Great day for cycling to work',
      reasoning: 'Dry conditions and mild temperatures make for comfortable cycling weather.',
      windNote: '',
      priority: 'high',
    }
  }
}

/**
 * Finds the best solar generation period
 */
function findBestSolarPeriod(sunnyPeriods: SimplifiedWeather['sunnyPeriods']) {
  if (sunnyPeriods.length === 0) {
    return { start: '12pm', end: '3pm', temp: 15 }
  }

  // Find the period with lowest cloud coverage around midday (11am-3pm)
  const middayPeriods = sunnyPeriods.filter((p) => p.hour >= 11 && p.hour <= 15)

  if (middayPeriods.length > 0) {
    const best = middayPeriods.reduce((prev, current) =>
      current.cloudCoverage < prev.cloudCoverage ? current : prev
    )

    return {
      start: `${best.hour % 12 || 12}${best.hour >= 12 ? 'pm' : 'am'}`,
      end: `${(best.hour + 3) % 12 || 12}${best.hour + 3 >= 12 ? 'pm' : 'am'}`,
      temp: Math.round(best.temp),
    }
  }

  // Default to first available sunny period
  const first = sunnyPeriods[0]
  return {
    start: `${first.hour % 12 || 12}${first.hour >= 12 ? 'pm' : 'am'}`,
    end: `${(first.hour + 3) % 12 || 12}${first.hour + 3 >= 12 ? 'pm' : 'am'}`,
    temp: Math.round(first.temp),
  }
}
