import { z } from 'zod'

// User preferences schema
export const userPreferencesSchema = z.object({
  postcode: z
    .string()
    .min(1, 'Postcode is required')
    .regex(/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, 'Invalid UK postcode format')
    .transform((val) => val.toUpperCase().replace(/\s/g, '')),
  hasGarden: z.boolean().default(false),
  hasEV: z.boolean().default(false),
  cycleToWork: z.boolean().default(false),
  hasSolar: z.boolean().default(false),
  // Time-of-day availability (when user is typically home on weekdays)
  // Note: We assume flexibility on weekends, so no weekend-specific settings
  homeWeekdayMorning: z.boolean().default(false), // 6am-12pm weekdays
  homeWeekdayAfternoon: z.boolean().default(false), // 12pm-6pm weekdays
  homeWeekdayEvening: z.boolean().default(true), // 6pm-12am weekdays (default: most people home)
})

export type UserPreferences = z.infer<typeof userPreferencesSchema>

// Postcodes.io API response schema
export const postcodeResponseSchema = z.object({
  status: z.number(),
  result: z.object({
    postcode: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    admin_district: z.string().optional(),
    region: z.string().optional(),
  }).nullable(),
})

export type PostcodeResponse = z.infer<typeof postcodeResponseSchema>

// Simplified weather data for recommendation engine
// Note: Open-Meteo API response is not validated with Zod as it's a trusted source
// and the API is very stable. We transform it directly in lib/api.ts
export const simplifiedWeatherSchema = z.object({
  date: z.string(),
  tempHigh: z.number(),
  tempLow: z.number(),
  avgTemp: z.number(),
  conditions: z.string(),
  cloudCoveragePercent: z.number(),
  windSpeedMph: z.number(),
  rainProbability: z.number(),
  sunnyHours: z.number(),
  sunrise: z.string(), // ISO 8601 format time string
  sunset: z.string(), // ISO 8601 format time string
  sunnyPeriods: z.array(
    z.object({
      hour: z.number(),
      temp: z.number(),
      cloudCoverage: z.number(),
    })
  ),
})

export type SimplifiedWeather = z.infer<typeof simplifiedWeatherSchema>

// Recommendation schema
export const recommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  reasoning: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  savingsEstimate: z.string().optional(),
  category: z.enum(['heating', 'laundry', 'mobility', 'cooking', 'insulation']).optional(),
  impact: z.enum(['high', 'medium', 'low']).optional(),
  timeStatus: z.enum(['active', 'passed']).optional(),
})

export type Recommendation = z.infer<typeof recommendationSchema>
