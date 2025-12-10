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
  hasSolar: z.boolean().default(false),
  hasTimeOfUseTariff: z.boolean().default(false), // Economy 7, Octopus Agile, etc.
  preferredTemperature: z.number().min(15).max(25).default(19), // User's preferred home temperature in Celsius
  heatingType: z.enum(['gas', 'electric', 'heat-pump', 'other']).default('gas'), // Type of heating system
  hotWaterSystem: z.enum(['combi', 'tank', 'electric', 'other']).default('combi'), // Type of hot water system
})

export type UserPreferences = z.infer<typeof userPreferencesSchema>

// Postcodes.io API response schema
export const postcodeResponseSchema = z.object({
  status: z.number(),
  result: z
    .object({
      postcode: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      admin_district: z.string().optional(),
      region: z.string().optional(),
    })
    .nullable(),
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
  tempNow: z.number().optional(),
  conditions: z.string(), // Primary/most severe condition
  conditionsRange: z.string().optional(), // Range if varied (e.g., "Drizzle → Heavy Rain")
  cloudCoveragePercent: z.number(),
  windSpeedMph: z.number(), // Average wind speed
  windSpeedMax: z.number(), // Maximum wind speed (gusts)
  rainProbability: z.number(),
  avgHumidity: z.number(), // Average relative humidity percentage (0-100)
  sunnyHours: z.number(), // Hours with good solar radiation (for solar panels)
  dryingHours: z.number(), // Hours with good solar AND low rain (for line-drying)
  sunrise: z.string(), // ISO 8601 format time string
  sunset: z.string(), // ISO 8601 format time string
  sunnyPeriods: z.array(
    z.object({
      hour: z.number(),
      temp: z.number(),
      cloudCoverage: z.number(),
      solarRadiation: z.number(), // W/m² - Global Horizontal Irradiance
    })
  ),
  continuousDryingPeriods: z.array(
    z.object({
      startHour: z.number(), // Start hour (0-23)
      endHour: z.number(), // End hour (0-23)
      duration: z.number(), // Number of hours
      avgScore: z.number(), // Average drying score (0-1)
      avgTemp: z.number(), // Average temperature
      avgHumidity: z.number(), // Average humidity
    })
  ),
})

export type SimplifiedWeather = z.infer<typeof simplifiedWeatherSchema>

// Carbon Intensity API schemas
export const fuelMixSchema = z.object({
  fuel: z.string(),
  perc: z.number(),
})

export type FuelMix = z.infer<typeof fuelMixSchema>

// Schema for /generation endpoint (no intensity data)
export const gridGenerationResponseSchema = z.object({
  data: z.object({
    from: z.string(),
    to: z.string(),
    generationmix: z.array(fuelMixSchema),
  }),
})

// Schema for /intensity endpoint (includes intensity but not generation mix)
export const gridIntensityResponseSchema = z.object({
  data: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      intensity: z.object({
        forecast: z.number(), // Carbon intensity in g/kWh
        index: z.enum(['very low', 'low', 'moderate', 'high', 'very high']),
      }),
    })
  ),
})

export type GridIntensityResponse = z.infer<typeof gridIntensityResponseSchema>

// Grouped grid data for UI display
export const gridDataSchema = z.object({
  carbonIntensity: z.number(), // g/kWh
  carbonIndex: z.enum(['very low', 'low', 'moderate', 'high', 'very high']),
  renewablePercent: z.number(), // Combined wind + solar + hydro
  fossilPercent: z.number(), // Combined gas + coal
  nuclearPercent: z.number(),
  otherPercent: z.number(), // Combined biomass + imports + other
  fuelBreakdown: z.array(
    z.object({
      fuel: z.string(),
      perc: z.number(),
      category: z.enum(['renewable', 'fossil', 'nuclear', 'other']),
    })
  ),
  timestamp: z.string(),
})

export type GridData = z.infer<typeof gridDataSchema>

// Recommendation schema
export const recommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  reasoning: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  savingsEstimate: z.string().optional(),
  category: z
    .enum(['heating', 'laundry', 'mobility', 'cooking', 'insulation', 'appliances'])
    .optional(),
  impact: z.enum(['high', 'medium', 'low']).optional(),
  timeStatus: z.enum(['active', 'passed']).optional(),
  isPersonalised: z.boolean().default(false), // True if based on user's specific setup (garden, EV, solar, tariff)
})

export type Recommendation = z.infer<typeof recommendationSchema>
