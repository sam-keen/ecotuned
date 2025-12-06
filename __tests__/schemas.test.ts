import { userPreferencesSchema, simplifiedWeatherSchema, recommendationSchema } from '@/lib/schemas'

describe('userPreferencesSchema', () => {
  test('should validate a valid preferences object', () => {
    const valid = {
      postcode: 'SW1A 2AA',
      hasGarden: true,
      hasEV: false,
      cycleToWork: true,
      hasSolar: false,
      homeWeekdayMorning: true,
      homeWeekdayAfternoon: false,
      homeWeekdayEvening: true,
    }

    const result = userPreferencesSchema.parse(valid)

    expect(result).toBeDefined()
    expect(result.postcode).toBe('SW1A2AA') // Should be normalized (no spaces, uppercase)
    expect(result.hasGarden).toBe(true)
    expect(result.homeWeekdayMorning).toBe(true)
  })

  test('should normalize postcode (remove spaces and uppercase)', () => {
    const input = {
      postcode: 'sw1a 2aa',
      hasGarden: false,
      hasEV: false,
      cycleToWork: false,
      hasSolar: false,
    }

    const result = userPreferencesSchema.parse(input)

    expect(result.postcode).toBe('SW1A2AA')
  })

  test('should reject invalid postcode format', () => {
    const invalid = {
      postcode: 'INVALID123',
      hasGarden: false,
      hasEV: false,
      cycleToWork: false,
      hasSolar: false,
    }

    expect(() => userPreferencesSchema.parse(invalid)).toThrow()
  })

  test('should reject empty postcode', () => {
    const invalid = {
      postcode: '',
      hasGarden: false,
      hasEV: false,
      cycleToWork: false,
      hasSolar: false,
    }

    expect(() => userPreferencesSchema.parse(invalid)).toThrow()
  })

  test('should default boolean fields to false (except evening which defaults to true)', () => {
    const minimal = {
      postcode: 'SW1A2AA',
    }

    const result = userPreferencesSchema.parse(minimal)

    expect(result.hasGarden).toBe(false)
    expect(result.hasEV).toBe(false)
    expect(result.cycleToWork).toBe(false)
    expect(result.hasSolar).toBe(false)
    expect(result.homeWeekdayMorning).toBe(false)
    expect(result.homeWeekdayAfternoon).toBe(false)
    expect(result.homeWeekdayEvening).toBe(true) // Defaults to true
  })

  test('should accept various valid UK postcode formats', () => {
    const validPostcodes = [
      'SW1A 2AA',
      'M1 1AE',
      'B33 8TH',
      'CR2 6XH',
      'DN55 1PT',
      'W1A 0AX',
      'EC1A 1BB',
    ]

    validPostcodes.forEach((postcode) => {
      const result = userPreferencesSchema.parse({
        postcode,
        hasGarden: false,
        hasEV: false,
        cycleToWork: false,
        hasSolar: false,
      })
      expect(result).toBeDefined()
    })
  })
})

describe('simplifiedWeatherSchema', () => {
  test('should validate a valid weather object', () => {
    const valid = {
      date: '2025-12-05',
      tempHigh: 15,
      tempLow: 8,
      avgTemp: 12,
      conditions: 'Clear',
      cloudCoveragePercent: 20,
      windSpeedMph: 10,
      rainProbability: 15,
      sunnyHours: 6,
      sunrise: '2025-12-05T08:00:00',
      sunset: '2025-12-05T16:00:00',
      sunnyPeriods: [
        { hour: 12, temp: 15, cloudCoverage: 10 },
        { hour: 15, temp: 16, cloudCoverage: 15 },
      ],
    }

    const result = simplifiedWeatherSchema.parse(valid)

    expect(result).toBeDefined()
    expect(result.tempHigh).toBe(15)
    expect(result.sunnyPeriods).toHaveLength(2)
    expect(result.sunrise).toBe('2025-12-05T08:00:00')
    expect(result.sunset).toBe('2025-12-05T16:00:00')
  })

  test('should reject invalid weather data', () => {
    const invalid = {
      date: '2025-12-05',
      tempHigh: 'not a number', // Invalid type
      tempLow: 8,
      avgTemp: 12,
      conditions: 'Clear',
      cloudCoveragePercent: 20,
      windSpeedMph: 10,
      rainProbability: 15,
      sunnyHours: 6,
      sunnyPeriods: [],
    }

    expect(() => simplifiedWeatherSchema.parse(invalid)).toThrow()
  })

  test('should allow empty sunnyPeriods array', () => {
    const valid = {
      date: '2025-12-05',
      tempHigh: 15,
      tempLow: 8,
      avgTemp: 12,
      conditions: 'Cloudy',
      cloudCoveragePercent: 90,
      windSpeedMph: 10,
      rainProbability: 80,
      sunnyHours: 0,
      sunrise: '2025-12-05T08:00:00',
      sunset: '2025-12-05T16:00:00',
      sunnyPeriods: [],
    }

    const result = simplifiedWeatherSchema.parse(valid)

    expect(result.sunnyPeriods).toEqual([])
    expect(result.sunnyHours).toBe(0)
  })
})

describe('recommendationSchema', () => {
  test('should validate a valid recommendation', () => {
    const valid = {
      id: 'test-recommendation',
      title: 'Test Recommendation',
      description: 'This is a test recommendation',
      reasoning: 'Testing purposes',
      priority: 'high' as const,
      savingsEstimate: 'Save £1-£2',
    }

    const result = recommendationSchema.parse(valid)

    expect(result).toBeDefined()
    expect(result.priority).toBe('high')
  })

  test('should allow missing savingsEstimate', () => {
    const valid = {
      id: 'test-recommendation',
      title: 'Test Recommendation',
      description: 'This is a test recommendation',
      reasoning: 'Testing purposes',
      priority: 'medium' as const,
    }

    const result = recommendationSchema.parse(valid)

    expect(result).toBeDefined()
    expect(result.savingsEstimate).toBeUndefined()
  })

  test('should reject invalid priority', () => {
    const invalid = {
      id: 'test-recommendation',
      title: 'Test Recommendation',
      description: 'This is a test recommendation',
      reasoning: 'Testing purposes',
      priority: 'urgent', // Not a valid priority
    }

    expect(() => recommendationSchema.parse(invalid)).toThrow()
  })

  test('should validate all priority levels', () => {
    const priorities = ['high', 'medium', 'low'] as const

    priorities.forEach((priority) => {
      const recommendation = {
        id: 'test-recommendation',
        title: 'Test Recommendation',
        description: 'This is a test recommendation',
        reasoning: 'Testing purposes',
        priority,
      }

      const result = recommendationSchema.parse(recommendation)
      expect(result.priority).toBe(priority)
    })
  })
})
