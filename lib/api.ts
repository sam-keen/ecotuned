import {
  postcodeResponseSchema,
  type SimplifiedWeather,
  gridGenerationResponseSchema,
  type GridData,
} from './schemas'

/**
 * Fetches postcode data from Postcodes.io API
 * Returns latitude and longitude for the given UK postcode
 */
export async function fetchPostcodeData(postcode: string) {
  const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()

  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Invalid postcode - please check and try again')
      }
      throw new Error('Failed to validate postcode')
    }

    const data = await response.json()
    const validated = postcodeResponseSchema.parse(data)

    if (!validated.result) {
      throw new Error('Invalid postcode data received')
    }

    return {
      latitude: validated.result.latitude,
      longitude: validated.result.longitude,
      postcode: validated.result.postcode,
      region: validated.result.region,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to fetch postcode data')
  }
}

/**
 * Fetches weather forecast for both today and tomorrow from Open-Meteo API
 * Returns an object with today and tomorrow forecast data
 * Open-Meteo is free and requires no API key
 */
export async function fetchTodayAndTomorrowWeather(
  latitude: number,
  longitude: number
): Promise<{ today: SimplifiedWeather; tomorrow: SimplifiedWeather }> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly:
        'temperature_2m,precipitation_probability,cloud_cover,wind_speed_10m,weather_code,shortwave_radiation,relative_humidity_2m',
      daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
      timezone: 'Europe/London',
      forecast_days: '2',
    })

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to fetch weather forecast from Open-Meteo')
    }

    const data = await response.json()

    // Get today and tomorrow's dates
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayDateStr = today.toISOString().split('T')[0]
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0]

    // Process today
    const todayWeather = processDayWeather(data, todayDateStr, 'Today')

    // Process tomorrow
    const tomorrowWeather = processDayWeather(data, tomorrowDateStr, 'Tomorrow')

    return {
      today: todayWeather,
      tomorrow: tomorrowWeather,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to process weather forecast')
  }
}

/**
 * Calculate drying score for an hour based on scientific research
 * Score ranges from 0 (terrible) to 1 (perfect)
 * Based on Vileda formula and MetService research:
 * - Humidity < 70% is ideal (most important factor)
 * - Temperature 21°C+ is ideal (but cold dry days can work)
 * - Wind 8-12mph is optimal
 * - Solar radiation helps significantly
 * - Time of day matters (12pm-5pm best)
 * - Rain probability must be low
 */
function calculateDryingScore(hourData: any): number {
  const temp = hourData.temp
  const humidity = hourData.humidity
  const windSpeedMph = hourData.windSpeed * 0.621371
  const solarRadiation = hourData.solarRadiation || 0
  const rainProb = hourData.rainProb || 0
  const hour = new Date(hourData.time).getHours()

  // Rain is a deal-breaker
  if (rainProb > 40) return 0

  let score = 0

  // Humidity factor (most important - 40% of score)
  // < 50% = excellent, 50-70% = good, 70-85% = marginal, > 85% = poor
  if (humidity < 50) {
    score += 0.4
  } else if (humidity < 70) {
    score += 0.4 * (1 - (humidity - 50) / 20) // Linear decrease from 0.4 to 0.2
  } else if (humidity < 85) {
    score += 0.2 * (1 - (humidity - 70) / 15) // Linear decrease from 0.2 to 0
  }

  // Solar radiation factor (30% of score)
  // Research shows cold dry days with sun can dry well
  if (solarRadiation > 400) {
    score += 0.3
  } else if (solarRadiation > 200) {
    score += 0.3 * (solarRadiation / 400) // Linear increase
  } else if (solarRadiation > 100) {
    score += 0.15 * (solarRadiation / 200) // Partial credit for weak sun
  }

  // Wind factor (15% of score)
  // Optimal is 8-12mph, but 5-20mph is still helpful
  if (windSpeedMph >= 8 && windSpeedMph <= 12) {
    score += 0.15
  } else if (windSpeedMph >= 5 && windSpeedMph <= 20) {
    score += 0.1
  } else if (windSpeedMph > 20 && windSpeedMph <= 25) {
    score += 0.05 // Too windy is less ideal
  }

  // Temperature factor (10% of score)
  // 21°C+ is ideal, but cold days can work with other factors
  if (temp >= 21) {
    score += 0.1
  } else if (temp >= 15) {
    score += (0.1 * (temp - 15)) / 6 // Linear increase
  } else if (temp >= 5) {
    score += (0.05 * (temp - 5)) / 10 // Partial credit for cool days
  }

  // Time of day factor (5% of score)
  // 12pm-5pm is optimal (peaks at 3pm)
  if (hour >= 12 && hour <= 17) {
    const distanceFrom3pm = Math.abs(hour - 15)
    score += 0.05 * (1 - distanceFrom3pm / 5) // Peaks at 3pm
  } else if (hour >= 10 && hour < 12) {
    score += 0.03 // Morning sun is still decent
  } else if (hour > 17 && hour <= 19) {
    score += 0.02 // Evening sun is marginal
  }

  // Rain probability penalty
  if (rainProb > 20 && rainProb <= 40) {
    score *= 0.7 // Reduce score by 30% if moderate rain risk
  }

  return Math.min(score, 1) // Cap at 1
}

/**
 * Find continuous periods of good drying conditions
 * Returns array of periods with start/end hours and average score
 */
function findContinuousDryingPeriods(
  hoursWithScore: Array<{ hour: number; dryingScore: number; [key: string]: any }>
): Array<{
  startHour: number
  endHour: number
  hours: typeof hoursWithScore
  avgScore: number
  duration: number
}> {
  const periods: Array<{
    startHour: number
    endHour: number
    hours: typeof hoursWithScore
    avgScore: number
    duration: number
  }> = []

  let currentPeriod: typeof hoursWithScore = []
  const threshold = 0.4 // Minimum score to be considered "good enough"

  for (const hour of hoursWithScore) {
    if (hour.dryingScore >= threshold) {
      currentPeriod.push(hour)
    } else {
      // End of a continuous period
      if (currentPeriod.length > 0) {
        const avgScore =
          currentPeriod.reduce((sum, h) => sum + h.dryingScore, 0) / currentPeriod.length
        periods.push({
          startHour: currentPeriod[0].hour,
          endHour: currentPeriod[currentPeriod.length - 1].hour,
          hours: currentPeriod,
          avgScore,
          duration: currentPeriod.length,
        })
        currentPeriod = []
      }
    }
  }

  // Don't forget the last period if it extends to end of day
  if (currentPeriod.length > 0) {
    const avgScore = currentPeriod.reduce((sum, h) => sum + h.dryingScore, 0) / currentPeriod.length
    periods.push({
      startHour: currentPeriod[0].hour,
      endHour: currentPeriod[currentPeriod.length - 1].hour,
      hours: currentPeriod,
      avgScore,
      duration: currentPeriod.length,
    })
  }

  return periods
}

/**
 * Get current hour in UK timezone (Europe/London)
 * Used to filter out past hours from today's forecast
 */
function getCurrentUKHour(): number {
  const now = new Date()
  const ukTime = new Date(
    now.toLocaleString('en-US', {
      timeZone: 'Europe/London',
    })
  )
  return ukTime.getHours()
}

/**
 * Helper function to process weather data for a specific day
 */
function processDayWeather(data: any, dateStr: string, label: string): SimplifiedWeather {
  // Find day's index in the daily data
  const dayIndex = data.daily.time.indexOf(dateStr)

  if (dayIndex === -1) {
    throw new Error(`No forecast data available for ${label}`)
  }

  // Get daily stats
  const tempHigh = Math.round(data.daily.temperature_2m_max[dayIndex])
  const tempLow = Math.round(data.daily.temperature_2m_min[dayIndex])
  const avgTemp = Math.round((tempHigh + tempLow) / 2)
  const sunrise = data.daily.sunrise[dayIndex]
  const sunset = data.daily.sunset[dayIndex]

  // Filter hourly data for this day
  const dayHourlyData = data.hourly.time
    .map((time: string, index: number) => ({
      time,
      hour: new Date(time).getHours(),
      temp: data.hourly.temperature_2m[index],
      cloudCoverage: data.hourly.cloud_cover[index],
      rainProb: data.hourly.precipitation_probability[index] || 0,
      windSpeed: data.hourly.wind_speed_10m[index],
      weatherCode: data.hourly.weather_code[index],
      solarRadiation: data.hourly.shortwave_radiation[index] || 0,
      humidity: data.hourly.relative_humidity_2m[index] || 50,
    }))
    .filter((item: any) => item.time.startsWith(dateStr))

  if (dayHourlyData.length === 0) {
    throw new Error(`No hourly forecast data available for ${label}`)
  }

  // Calculate average cloud coverage
  const avgCloudCoverage = Math.round(
    dayHourlyData.reduce((sum: number, h: any) => sum + h.cloudCoverage, 0) / dayHourlyData.length
  )

  // Calculate average wind speed (convert km/h to mph)
  const avgWindSpeed = Math.round(
    (dayHourlyData.reduce((sum: number, h: any) => sum + h.windSpeed, 0) / dayHourlyData.length) *
      0.621371
  )

  // Calculate max wind speed (gusts) (convert km/h to mph)
  const maxWindSpeed = Math.round(
    Math.max(...dayHourlyData.map((h: any) => h.windSpeed)) * 0.621371
  )

  // Calculate max rain probability
  const maxRainProb = Math.round(Math.max(...dayHourlyData.map((h: any) => h.rainProb)))

  // Calculate average humidity
  const avgHumidity = Math.round(
    dayHourlyData.reduce((sum: number, h: any) => sum + h.humidity, 0) / dayHourlyData.length
  )

  // Determine weather conditions - find most and least severe
  const weatherCodes: number[] = dayHourlyData.map((h: any) => h.weatherCode)
  const uniqueCodes = [...new Set(weatherCodes)]

  // Sort by severity to find least and most severe conditions
  const sortedBySeverity = uniqueCodes.sort(
    (a: number, b: number) => getWeatherSeverity(a) - getWeatherSeverity(b)
  )
  const leastSevereCode = sortedBySeverity[0]
  const mostSevereCode = sortedBySeverity[sortedBySeverity.length - 1]

  // Primary condition is the most severe
  const conditions = getWeatherConditionFromCode(mostSevereCode)

  // Create range string if conditions vary significantly
  let conditionsRange: string | undefined
  if (
    sortedBySeverity.length > 1 &&
    getWeatherSeverity(mostSevereCode) - getWeatherSeverity(leastSevereCode) >= 2
  ) {
    const leastSevereCondition = getWeatherConditionFromCode(leastSevereCode)
    conditionsRange = `${leastSevereCondition} / ${conditions}`
  }

  // Find sunny periods (good solar radiation > 200 W/m²)
  // Used for solar panel recommendations - rain doesn't matter
  const sunnyPeriods = dayHourlyData
    .filter((h: any) => h.solarRadiation > 200)
    .map((h: any) => ({
      hour: h.hour,
      temp: Math.round(h.temp),
      cloudCoverage: h.cloudCoverage,
      solarRadiation: Math.round(h.solarRadiation),
    }))

  // Calculate drying score for each hour based on scientific research
  // Research: humidity > solar radiation > wind > temperature
  const hoursWithDryingScore = dayHourlyData.map((h: any) => ({
    hour: h.hour,
    temp: Math.round(h.temp),
    cloudCoverage: h.cloudCoverage,
    solarRadiation: Math.round(h.solarRadiation),
    rainProbability: h.rainProb,
    humidity: Math.round(h.humidity),
    windSpeed: Math.round(h.windSpeed * 0.621371), // Convert to mph
    dryingScore: calculateDryingScore(h),
  }))

  // Find continuous drying periods (score >= 0.4 indicates decent drying conditions)
  const continuousDryingPeriodsRaw = findContinuousDryingPeriods(hoursWithDryingScore)

  // Filter out past hours if this is today
  const today = new Date()
  const todayDateStr = today.toISOString().split('T')[0]
  const isToday = dateStr === todayDateStr
  const currentUKHour = isToday ? getCurrentUKHour() : -1

  // Get current temperature (for today only)
  let tempNow

  if (isToday) {
    const currentHourData = dayHourlyData.find((h: any) => h.hour === currentUKHour)

    if (currentHourData) {
      tempNow = Math.round(currentHourData.temp)
    } else {
      tempNow = undefined
    }
  }

  // Transform and filter periods
  const continuousDryingPeriods = continuousDryingPeriodsRaw
    .map((period) => {
      // If this is today, filter out hours that have passed
      let filteredHours = period.hours
      if (isToday && currentUKHour >= 0) {
        filteredHours = period.hours.filter((h) => h.hour >= currentUKHour)
      }

      // Skip this period if no hours remain
      if (filteredHours.length === 0) return null

      // Recalculate start/end based on filtered hours
      const newStartHour = filteredHours[0].hour
      const newEndHour = filteredHours[filteredHours.length - 1].hour

      return {
        startHour: newStartHour,
        endHour: newEndHour,
        duration: filteredHours.length,
        avgScore: Math.round(period.avgScore * 100) / 100,
        avgTemp: Math.round(
          filteredHours.reduce((sum, h) => sum + h.temp, 0) / filteredHours.length
        ),
        avgHumidity: Math.round(
          filteredHours.reduce((sum, h) => sum + h.humidity, 0) / filteredHours.length
        ),
      }
    })
    .filter((period) => period !== null) as Array<{
    startHour: number
    endHour: number
    duration: number
    avgScore: number
    avgTemp: number
    avgHumidity: number
  }>

  const sunnyHours = sunnyPeriods.length

  // Calculate total drying hours from continuous periods
  const dryingHours = continuousDryingPeriods.reduce((sum, period) => sum + period.duration, 0)

  return {
    date: dateStr,
    tempHigh,
    tempLow,
    avgTemp,
    tempNow,
    conditions,
    conditionsRange,
    cloudCoveragePercent: avgCloudCoverage,
    windSpeedMph: avgWindSpeed,
    windSpeedMax: maxWindSpeed,
    rainProbability: maxRainProb,
    avgHumidity,
    sunnyHours,
    dryingHours,
    sunrise,
    sunset,
    sunnyPeriods,
    continuousDryingPeriods,
  }
}

/**
 * Converts WMO Weather Code to human-readable condition
 * https://open-meteo.com/en/docs
 * More granular mapping for better accuracy
 */
function getWeatherConditionFromCode(code: number): string {
  if (code === 0) return 'Clear'
  if (code === 1) return 'Mostly Clear'
  if (code === 2) return 'Partly Cloudy'
  if (code === 3) return 'Overcast'
  if (code >= 45 && code <= 48) return 'Foggy'
  if (code >= 51 && code <= 55) return 'Drizzle'
  if (code >= 56 && code <= 57) return 'Freezing Drizzle'
  if (code >= 61 && code <= 63) return 'Rain'
  if (code >= 64 && code <= 65) return 'Heavy Rain'
  if (code >= 66 && code <= 67) return 'Freezing Rain'
  if (code >= 71 && code <= 75) return 'Snow'
  if (code >= 77 && code <= 79) return 'Snow Grains'
  if (code === 80) return 'Light Showers'
  if (code === 81) return 'Showers'
  if (code === 82) return 'Heavy Showers'
  if (code >= 85 && code <= 86) return 'Snow Showers'
  if (code === 95) return 'Thunderstorm'
  if (code >= 96 && code <= 99) return 'Thunderstorm with Hail'
  return 'Unknown'
}

/**
 * Gets severity ranking for weather codes (higher = more severe)
 */
function getWeatherSeverity(code: number): number {
  if (code === 0) return 0 // Clear
  if (code <= 3) return 1 // Partly cloudy
  if (code <= 48) return 2 // Fog
  if (code <= 55) return 3 // Drizzle
  if (code <= 57) return 4 // Freezing drizzle
  if (code <= 63) return 5 // Rain
  if (code <= 65) return 6 // Heavy rain
  if (code <= 67) return 7 // Freezing rain
  if (code <= 79) return 6 // Snow
  if (code <= 82) return 7 // Showers (light to heavy)
  if (code <= 86) return 7 // Snow showers
  if (code <= 95) return 8 // Thunderstorm
  if (code <= 99) return 9 // Thunderstorm with hail
  return 0
}

/**
 * Fetches current grid intensity data from Carbon Intensity API
 * Returns current generation mix and carbon intensity for GB
 * Carbon Intensity API is free and requires no API key
 */
export async function fetchGridIntensity(): Promise<GridData> {
  try {
    // Fetch both generation mix and intensity data
    const [genResponse, intensityResponse] = await Promise.all([
      fetch('https://api.carbonintensity.org.uk/generation'),
      fetch('https://api.carbonintensity.org.uk/intensity'),
    ])

    if (!genResponse.ok) {
      throw new Error('Failed to fetch grid generation data from Carbon Intensity API')
    }

    const genData = await genResponse.json()
    const validated = gridGenerationResponseSchema.parse(genData)

    // Try to get intensity data, but don't fail if unavailable
    let intensityData = null
    if (intensityResponse.ok) {
      intensityData = await intensityResponse.json()
    }

    // Transform raw API data into our GridData format
    const { data } = validated
    const generationmix = data.generationmix

    // Categorize fuels and calculate totals
    const fuelCategories: Record<string, 'renewable' | 'fossil' | 'nuclear' | 'other'> = {
      wind: 'renewable',
      solar: 'renewable',
      hydro: 'renewable',
      gas: 'fossil',
      coal: 'fossil',
      nuclear: 'nuclear',
      biomass: 'other',
      imports: 'other',
      other: 'other',
    }

    let renewableTotal = 0
    let fossilTotal = 0
    let nuclearTotal = 0
    let otherTotal = 0

    const fuelBreakdown = generationmix.map((fuel) => {
      const category = fuelCategories[fuel.fuel] || 'other'

      // Add to category totals
      if (category === 'renewable') renewableTotal += fuel.perc
      else if (category === 'fossil') fossilTotal += fuel.perc
      else if (category === 'nuclear') nuclearTotal += fuel.perc
      else otherTotal += fuel.perc

      return {
        fuel: fuel.fuel,
        perc: fuel.perc,
        category,
      }
    })

    // Get carbon intensity from the intensity endpoint if available
    let carbonIntensity = 0
    let carbonIndex: 'very low' | 'low' | 'moderate' | 'high' | 'very high' = 'moderate'

    if (intensityData?.data?.[0]?.intensity) {
      carbonIntensity = intensityData.data[0].intensity.forecast || 0
      carbonIndex = intensityData.data[0].intensity.index || 'moderate'
    }

    return {
      carbonIntensity,
      carbonIndex,
      renewablePercent: Math.round(renewableTotal * 10) / 10,
      fossilPercent: Math.round(fossilTotal * 10) / 10,
      nuclearPercent: Math.round(nuclearTotal * 10) / 10,
      otherPercent: Math.round(otherTotal * 10) / 10,
      fuelBreakdown,
      timestamp: data.from,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to process grid intensity data')
  }
}
