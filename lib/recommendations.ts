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

  // Determine if this is a weekend day using the weather date
  const weatherDate = new Date(weather.date)
  const dayOfWeek = weatherDate.getDay() // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // 1. Line-dry laundry recommendation (improved accuracy)
  if (prefs.hasGarden && shouldLineDry(weather)) {
    const dryingQuality = getLineDryQuality(weather)
    const windNote =
      weather.windSpeedMph >= 10 && weather.windSpeedMph <= 18
        ? ' Breezy conditions will help speed up drying - peg items securely.'
        : ''

    const humidityNote =
      weather.avgHumidity < 60
        ? ' Low humidity will help clothes dry faster.'
        : weather.avgHumidity > 75
          ? ' Higher humidity may slow drying slightly.'
          : ''

    recommendations.push({
      id: 'line-dry',
      title: dryingQuality.title,
      description: `${day === 'today' ? 'Today' : 'Tomorrow'} will have ${weather.dryingHours} hours of good drying conditions with ${weather.windSpeedMph}mph wind and ${weather.avgHumidity}% humidity.${humidityNote} Hang your washing outside to save energy and money.${windNote}`,
      reasoning: `${dryingQuality.reasoning} with low rain risk during sunny periods.`,
      priority: dryingQuality.priority,
      savingsEstimate: 'Save £0.85-£1.50 per load vs tumble dryer',
      category: 'laundry',
      impact: 'high',
      isPersonalised: true,
    })
  } else if (weather.avgHumidity < 50 && weather.dryingHours < 3) {
    // Indoor drying recommendation when outdoor conditions aren't ideal but humidity is low
    // Available to everyone, not just those with gardens
    recommendations.push({
      id: 'indoor-dry',
      title: 'Good conditions for indoor drying',
      description: `Low humidity ${day} (${weather.avgHumidity}%) means clothes will dry quickly indoors without additional heating. Use a clothes airer near natural ventilation.`,
      reasoning: 'Low humidity allows effective indoor drying, avoiding tumble dryer costs.',
      priority: 'medium',
      savingsEstimate: 'Save £0.85-£1.50 per load vs tumble dryer',
      category: 'laundry',
      impact: 'high',
      isPersonalised: true,
    })
  }

  // 2. EV charging with solar
  if (prefs.hasEV && prefs.hasSolar && weather.sunnyPeriods.length > 0) {
    const bestChargingPeriod = findBestSolarPeriod(weather.sunnyPeriods)
    recommendations.push({
      id: 'ev-solar-charging',
      title: 'Charge your EV during peak solar hours',
      description: `Best charging window: ${bestChargingPeriod.start}-${bestChargingPeriod.end} when your solar panels will generate maximum power.`,
      reasoning: `Clear skies during midday hours with temperatures around ${bestChargingPeriod.temp}°C mean strong solar generation.`,
      priority: 'high',
      savingsEstimate: 'Save £2-£4 per charge',
      category: 'mobility',
      impact: 'high',
      isPersonalised: true,
    })
  } else if (prefs.hasEV && !prefs.hasSolar && prefs.hasTimeOfUseTariff) {
    // EV charging recommendation without solar (only for time-of-use tariffs)
    recommendations.push({
      id: 'ev-offpeak-charging',
      title: 'Charge your EV during off-peak hours',
      description: 'Charge overnight (11pm-7am) to take advantage of cheaper electricity rates.',
      reasoning: 'Off-peak electricity is typically 50-70% cheaper than peak rates.',
      priority: 'high',
      savingsEstimate: 'Save £1.50-£3.00 per charge',
      category: 'mobility',
      impact: 'high',
      isPersonalised: true,
    })
  }

  // 3. Curtains/blinds for temperature control
  // These are personalised as they use the user's specific postcode weather forecast
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
      isPersonalised: true,
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
      isPersonalised: true,
    })
  }

  // 5. Heating/cooling optimisation (improved with dynamic priority)
  if (weather.avgTemp < 12) {
    const isVeryCold = weather.avgTemp < 5

    if (prefs.hasTimeOfUseTariff) {
      // Time-of-use tariff: recommend off-peak hot water usage
      recommendations.push({
        id: 'batch-hot-water',
        title: 'Use hot water during off-peak hours',
        description: `${isVeryCold ? 'Very cold' : 'Cold'} forecast ${day} (${weather.tempLow}-${weather.tempHigh}°C). Schedule showers, dishwashing, and laundry for off-peak hours (11pm-7am) to benefit from cheaper rates.`,
        reasoning:
          'Off-peak electricity is 50-70% cheaper, and hot water waste heat helps warm your home.',
        priority: 'high',
        savingsEstimate: 'Save £0.30-£0.60 per day',
        category: 'heating',
        impact: 'high',
        isPersonalised: true,
      })
    } else {
      // Flat-rate tariff: focus on efficiency without time constraints
      recommendations.push({
        id: 'efficient-hot-water',
        title: 'Optimise hot water usage',
        description: `${isVeryCold ? 'Very cold' : 'Cold'} forecast ${day} (${weather.tempLow}-${weather.tempHigh}°C). Keep showers short and batch hot water tasks together to maximise efficiency.`,
        reasoning: 'Waste heat from hot water helps warm your home when it is needed most.',
        priority: 'medium',
        savingsEstimate: 'Save £0.20-£0.40 per day',
        category: 'heating',
        impact: 'medium',
        isPersonalised: true,
      })
    }
  } else if (
    weather.tempHigh >= prefs.preferredTemperature &&
    weather.avgTemp < 21 &&
    weather.tempLow > prefs.preferredTemperature - 3
  ) {
    recommendations.push({
      id: 'natural-ventilation',
      title: 'Consider turning off heating',
      description: `Mild temperatures ${day} (${weather.tempHigh}°C) will reach your preferred temperature of ${prefs.preferredTemperature}°C - ideal conditions for natural ventilation.`,
      reasoning: `Outdoor temperatures will match your comfort level, making heating unnecessary.`,
      priority: 'high',
      savingsEstimate: 'Save £0.50-£1.50 on heating',
      category: 'heating',
      impact: 'high',
      isPersonalised: true,
    })
  } else if (weather.avgTemp >= 22 && weather.avgTemp < 26) {
    recommendations.push({
      id: 'avoid-heat-generating',
      title: 'Minimise heat-generating activities',
      description: `Warm ${day === 'today' ? 'weather today' : 'day ahead'} (${weather.tempHigh}°C). Use microwave instead of oven, or cook outdoors.`,
      reasoning: 'An hour of oven use adds 2-3kWh of heat to your home.',
      priority: 'low',
      savingsEstimate: 'Save £0.05-£0.15 on fans',
      category: 'cooking',
      impact: 'low',
      isPersonalised: false,
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
      isPersonalised: false,
    })
  }

  // 6. Rainy day batch cooking (energy-focused)
  // Only show on weekends - batch cooking requires extended time at home
  if (isWeekend && weather.rainProbability > 70 && weather.avgTemp < 15) {
    recommendations.push({
      id: 'rainy-day-cooking',
      title: 'Good day for batch cooking',
      description: `Cold and wet ${day} - ideal for batch cooking. Prep multiple meals at once while the oven heat helps warm your home.`,
      reasoning:
        'Oven heat reduces heating costs on cold days, and batch cooking 4+ meals saves ~3 hours of oven time over the week.',
      priority: 'medium',
      savingsEstimate: 'Save £0.50-£0.70 per batch session',
      category: 'cooking',
      impact: 'medium',
      isPersonalised: false,
    })
  }

  // 7. Heat pump efficiency recommendation (weather-specific)
  if (prefs.heatingType === 'heat-pump') {
    if (weather.avgTemp >= 5 && weather.avgTemp <= 15) {
      recommendations.push({
        id: 'heat-pump-optimal',
        title: 'Optimal conditions for your heat pump',
        description: `Temperatures ${day} (${weather.avgTemp}°C) are ideal for heat pump efficiency. Your system will use 30-40% less energy than in very cold weather.`,
        reasoning:
          'Heat pumps are most efficient between 5-15°C. Take advantage by maintaining comfortable temperatures without worry.',
        priority: 'medium',
        savingsEstimate: 'Save £0.40-£0.80 per day vs colder weather',
        category: 'heating',
        impact: 'high',
        isPersonalised: true,
      })
    } else if (weather.tempLow < 0) {
      recommendations.push({
        id: 'heat-pump-cold-weather',
        title: 'Prepare for reduced heat pump efficiency',
        description: `Very cold forecast ${day} (low of ${weather.tempLow}°C). Your heat pump will work harder. Pre-warm your home during milder afternoon hours.`,
        reasoning:
          'Heat pumps lose efficiency below 0°C. Pre-warming reduces strain during coldest periods.',
        priority: 'medium',
        savingsEstimate: 'Save £0.30-£0.50 by pre-warming',
        category: 'heating',
        impact: 'medium',
        isPersonalised: true,
      })
    }
  }

  // 8. Hot water tank timing (temperature-aware)
  if (prefs.hotWaterSystem === 'tank' && prefs.hasTimeOfUseTariff) {
    if (weather.tempLow > 10) {
      recommendations.push({
        id: 'tank-mild-night',
        title: 'Heat hot water tank during off-peak',
        description: `Mild night ahead (${weather.tempLow}°C low) means less heat loss from your tank. Heat during off-peak hours (11pm-7am) for maximum savings.`,
        reasoning: 'Warmer nights reduce tank heat loss, making off-peak heating more efficient.',
        priority: 'medium',
        savingsEstimate: 'Save £0.20-£0.35 per day',
        category: 'heating',
        impact: 'medium',
        isPersonalised: true,
      })
    } else if (weather.tempLow < 5) {
      recommendations.push({
        id: 'tank-cold-night',
        title: 'Heat hot water tank before peak cold',
        description: `Cold night forecast (${weather.tempLow}°C). Heat your tank during afternoon/evening to reduce overnight heat loss.`,
        reasoning:
          'Very cold nights increase tank heat loss. Pre-heating when warmer is more efficient.',
        priority: 'medium',
        savingsEstimate: 'Save £0.15-£0.25 vs overnight heating',
        category: 'heating',
        impact: 'medium',
        isPersonalised: true,
      })
    }
  }

  // 9. Electric heating with solar (daylight-specific)
  if (prefs.heatingType === 'electric' && prefs.hasSolar && weather.sunnyHours > 3) {
    const solarPeak =
      weather.sunnyPeriods.length > 0
        ? weather.sunnyPeriods.reduce((max, p) => (p.solarRadiation > max.solarRadiation ? p : max))
        : null

    if (solarPeak) {
      recommendations.push({
        id: 'electric-heating-solar',
        title: 'Use electric heating during peak solar generation',
        description: `Strong solar generation ${day} - run electric heating ${solarPeak.hour}:00-${solarPeak.hour + 2}:00 to use your own electricity.`,
        reasoning:
          'Electric heating powered by your solar panels is essentially free and zero-carbon.',
        priority: 'high',
        savingsEstimate: 'Save £1-£2 per day',
        category: 'heating',
        impact: 'high',
        isPersonalised: true,
      })
    }
  }

  // 10. Off-peak appliances (only for time-of-use tariffs)
  if (prefs.hasTimeOfUseTariff) {
    recommendations.push({
      id: 'off-peak-appliances',
      title: 'Run dishwasher and washing machine overnight',
      description: `Set your dishwasher and washing machine to run during off-peak hours ${day === 'today' ? 'tonight' : 'tomorrow night'} (11pm-7am).`,
      reasoning: 'Off-peak electricity is typically 50-70% cheaper than peak rates.',
      priority: 'medium',
      savingsEstimate: 'Save £0.15-£0.30 per cycle',
      category: 'appliances',
      impact: 'medium',
      isPersonalised: true,
    })
  }

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
 * Priority: Favor personalised recs, keep high-impact, ensure max 2 from any category
 */
function applyCategoryDiversity(recs: Recommendation[]): Recommendation[] {
  const result: Recommendation[] = []
  const categoryCount: Record<string, number> = {}

  // First pass: Add all high-priority, high-impact, personalised recommendations
  // These are the most valuable - personally relevant AND high impact
  for (const rec of recs) {
    if (rec.priority === 'high' && rec.impact === 'high' && rec.isPersonalised) {
      result.push(rec)
      categoryCount[rec.category || 'other'] = (categoryCount[rec.category || 'other'] || 0) + 1
    }
  }

  // Second pass: Add remaining personalised recommendations with diversity
  // Personalised recommendations are more valuable than generic ones
  for (const rec of recs) {
    if (result.includes(rec)) continue
    if (!rec.isPersonalised) continue // Only personalised in this pass

    const category = rec.category || 'other'
    const count = categoryCount[category] || 0

    // Allow max 2 recommendations per category
    if (count < 2) {
      result.push(rec)
      categoryCount[category] = count + 1
    }
  }

  // Third pass: Fill remaining slots with non-personalised recommendations
  for (const rec of recs) {
    if (result.includes(rec)) continue

    const category = rec.category || 'other'
    const count = categoryCount[category] || 0

    if (count < 2) {
      result.push(rec)
      categoryCount[category] = count + 1
    }
  }

  // If we still have room, add any remaining recs (relaxing category limit)
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
    return recs.map((rec) => ({ ...rec, timeStatus: 'active' as const }))
  }

  const now = new Date()
  const currentHour = now.getHours()

  // Parse sunset time to get the hour
  const sunsetTime = new Date(weather.sunset)
  const sunsetHour = sunsetTime.getHours()

  return recs.map((rec) => {
    let timeStatus: 'active' | 'passed' = 'active'

    // Line-dry: passed if after (sunset - 2 hours)
    if (rec.id === 'line-dry') {
      if (currentHour >= sunsetHour - 2) {
        timeStatus = 'passed'
      }
    }

    // EV solar charging: passed if after the best solar window ends
    // Calculate the actual best solar period to determine when it's passed
    if (rec.id === 'ev-solar-charging' && weather.sunnyPeriods.length > 0) {
      const bestPeriod = findBestSolarPeriod(weather.sunnyPeriods)
      const endHour = parseInt(bestPeriod.end.split(':')[0])
      if (currentHour >= endHour) {
        timeStatus = 'passed'
      }
    }

    return { ...rec, timeStatus }
  })
}

/**
 * Determines if weather is suitable for line-drying laundry
 * Uses dryingHours which already accounts for both solar radiation AND rain probability
 */
function shouldLineDry(weather: SimplifiedWeather): boolean {
  return (
    weather.dryingHours >= 3 && weather.windSpeedMph < 25 // Increased threshold - wind helps drying
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
  const isExceptional = weather.dryingHours >= 5 && weather.rainProbability < 10
  const isMarginal = weather.dryingHours >= 3 && weather.dryingHours < 5

  if (isExceptional) {
    return {
      title: 'Exceptional day for line-drying',
      reasoning: 'Outstanding drying conditions with plenty of dry, sunny hours',
      priority: 'high',
    }
  } else if (isMarginal) {
    return {
      title: 'Decent day for line-drying',
      reasoning: 'Good drying conditions though hours are limited',
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
 * Finds the best solar generation period based on actual solar radiation
 */
function findBestSolarPeriod(sunnyPeriods: SimplifiedWeather['sunnyPeriods']) {
  if (sunnyPeriods.length === 0) {
    return { start: '12pm', end: '3pm', temp: 15 }
  }

  // Find the period with highest solar radiation around midday (11am-3pm)
  const middayPeriods = sunnyPeriods.filter((p) => p.hour >= 11 && p.hour <= 15)

  if (middayPeriods.length > 0) {
    const best = middayPeriods.reduce((prev, current) =>
      current.solarRadiation > prev.solarRadiation ? current : prev
    )

    return {
      start: `${best.hour % 12 || 12}${best.hour >= 12 ? 'pm' : 'am'}`,
      end: `${(best.hour + 3) % 12 || 12}${best.hour + 3 >= 12 ? 'pm' : 'am'}`,
      temp: Math.round(best.temp),
    }
  }

  // Find the period with highest solar radiation overall
  const best = sunnyPeriods.reduce((prev, current) =>
    current.solarRadiation > prev.solarRadiation ? current : prev
  )

  return {
    start: `${best.hour % 12 || 12}${best.hour >= 12 ? 'pm' : 'am'}`,
    end: `${(best.hour + 3) % 12 || 12}${best.hour + 3 >= 12 ? 'pm' : 'am'}`,
    temp: Math.round(best.temp),
  }
}
