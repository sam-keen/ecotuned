import {
  postcodeResponseSchema,
  type SimplifiedWeather,
} from './schemas'

/**
 * Fetches postcode data from Postcodes.io API
 * Returns latitude and longitude for the given UK postcode
 */
export async function fetchPostcodeData(postcode: string) {
  const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase()

  try {
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${cleanPostcode}`
    )

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
 * Fetches weather forecast from Open-Meteo API
 * Returns tomorrow's forecast data
 * Open-Meteo is free and requires no API key
 */
export async function fetchWeatherForecast(
  latitude: number,
  longitude: number
): Promise<SimplifiedWeather> {
  try {
    // Build Open-Meteo API URL with required parameters
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly: 'temperature_2m,precipitation_probability,cloud_cover,wind_speed_10m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
      timezone: 'Europe/London',
      forecast_days: '2', // Today + Tomorrow
    })

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch weather forecast from Open-Meteo')
    }

    const data = await response.json()

    // Get tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0]

    // Find tomorrow's index in the daily data
    const tomorrowDailyIndex = data.daily.time.indexOf(tomorrowDateStr)

    if (tomorrowDailyIndex === -1) {
      throw new Error('No forecast data available for tomorrow')
    }

    // Get tomorrow's daily stats
    const tempHigh = Math.round(data.daily.temperature_2m_max[tomorrowDailyIndex])
    const tempLow = Math.round(data.daily.temperature_2m_min[tomorrowDailyIndex])
    const avgTemp = Math.round((tempHigh + tempLow) / 2)
    const sunrise = data.daily.sunrise[tomorrowDailyIndex]
    const sunset = data.daily.sunset[tomorrowDailyIndex]

    // Filter hourly data for tomorrow
    const tomorrowHourlyData = data.hourly.time
      .map((time: string, index: number) => ({
        time,
        hour: new Date(time).getHours(),
        temp: data.hourly.temperature_2m[index],
        cloudCoverage: data.hourly.cloud_cover[index],
        rainProb: data.hourly.precipitation_probability[index] || 0,
        windSpeed: data.hourly.wind_speed_10m[index],
        weatherCode: data.hourly.weather_code[index],
      }))
      .filter((item: any) => item.time.startsWith(tomorrowDateStr))

    if (tomorrowHourlyData.length === 0) {
      throw new Error('No hourly forecast data available for tomorrow')
    }

    // Calculate average cloud coverage
    const avgCloudCoverage = Math.round(
      tomorrowHourlyData.reduce((sum: number, h: any) => sum + h.cloudCoverage, 0) /
        tomorrowHourlyData.length
    )

    // Calculate average wind speed (convert km/h to mph)
    const avgWindSpeed = Math.round(
      (tomorrowHourlyData.reduce((sum: number, h: any) => sum + h.windSpeed, 0) /
        tomorrowHourlyData.length) *
        0.621371
    )

    // Calculate max rain probability
    const maxRainProb = Math.round(
      Math.max(...tomorrowHourlyData.map((h: any) => h.rainProb))
    )

    // Determine dominant weather condition from WMO weather codes
    const weatherCodes = tomorrowHourlyData.map((h: any) => h.weatherCode)
    const dominantCode = weatherCodes.sort(
      (a: number, b: number) =>
        weatherCodes.filter((c: number) => c === b).length -
        weatherCodes.filter((c: number) => c === a).length
    )[0]
    const conditions = getWeatherConditionFromCode(dominantCode)

    // Find sunny periods (cloud coverage < 30% and low rain probability)
    const sunnyPeriods = tomorrowHourlyData
      .filter((h: any) => h.cloudCoverage < 30 && h.rainProb < 30)
      .map((h: any) => ({
        hour: h.hour,
        temp: Math.round(h.temp),
        cloudCoverage: h.cloudCoverage,
      }))

    const sunnyHours = sunnyPeriods.length

    return {
      date: tomorrowDateStr,
      tempHigh,
      tempLow,
      avgTemp,
      conditions,
      cloudCoveragePercent: avgCloudCoverage,
      windSpeedMph: avgWindSpeed,
      rainProbability: maxRainProb,
      sunnyHours,
      sunrise,
      sunset,
      sunnyPeriods,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to process weather forecast')
  }
}

/**
 * Fetches weather forecast for both today and tomorrow
 * Returns an object with today and tomorrow forecast data
 */
export async function fetchTodayAndTomorrowWeather(
  latitude: number,
  longitude: number
): Promise<{ today: SimplifiedWeather; tomorrow: SimplifiedWeather }> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly: 'temperature_2m,precipitation_probability,cloud_cover,wind_speed_10m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
      timezone: 'Europe/London',
      forecast_days: '2',
    })

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`
    )

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
 * Helper function to process weather data for a specific day
 */
function processDayWeather(
  data: any,
  dateStr: string,
  label: string
): SimplifiedWeather {
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
    }))
    .filter((item: any) => item.time.startsWith(dateStr))

  if (dayHourlyData.length === 0) {
    throw new Error(`No hourly forecast data available for ${label}`)
  }

  // Calculate average cloud coverage
  const avgCloudCoverage = Math.round(
    dayHourlyData.reduce((sum: number, h: any) => sum + h.cloudCoverage, 0) /
      dayHourlyData.length
  )

  // Calculate average wind speed (convert km/h to mph)
  const avgWindSpeed = Math.round(
    (dayHourlyData.reduce((sum: number, h: any) => sum + h.windSpeed, 0) /
      dayHourlyData.length) *
      0.621371
  )

  // Calculate max rain probability
  const maxRainProb = Math.round(
    Math.max(...dayHourlyData.map((h: any) => h.rainProb))
  )

  // Determine dominant weather condition
  const weatherCodes = dayHourlyData.map((h: any) => h.weatherCode)
  const dominantCode = weatherCodes.sort(
    (a: number, b: number) =>
      weatherCodes.filter((c: number) => c === b).length -
      weatherCodes.filter((c: number) => c === a).length
  )[0]
  const conditions = getWeatherConditionFromCode(dominantCode)

  // Find sunny periods
  const sunnyPeriods = dayHourlyData
    .filter((h: any) => h.cloudCoverage < 30 && h.rainProb < 30)
    .map((h: any) => ({
      hour: h.hour,
      temp: Math.round(h.temp),
      cloudCoverage: h.cloudCoverage,
    }))

  const sunnyHours = sunnyPeriods.length

  return {
    date: dateStr,
    tempHigh,
    tempLow,
    avgTemp,
    conditions,
    cloudCoveragePercent: avgCloudCoverage,
    windSpeedMph: avgWindSpeed,
    rainProbability: maxRainProb,
    sunnyHours,
    sunrise,
    sunset,
    sunnyPeriods,
  }
}

/**
 * Converts WMO Weather Code to human-readable condition
 * https://open-meteo.com/en/docs
 */
function getWeatherConditionFromCode(code: number): string {
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 59) return 'Drizzle'
  if (code <= 69) return 'Rain'
  if (code <= 79) return 'Snow'
  if (code <= 84) return 'Showers'
  if (code <= 99) return 'Thunderstorm'
  return 'Unknown'
}
