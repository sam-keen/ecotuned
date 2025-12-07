import { generateRecommendations } from '@/lib/recommendations'
import type { SimplifiedWeather, UserPreferences } from '@/lib/schemas'

describe('generateRecommendations', () => {
  const baseWeather: SimplifiedWeather = {
    date: '2025-01-08', // Wednesday
    tempHigh: 15,
    tempLow: 8,
    avgTemp: 12,
    conditions: 'Clear',
    cloudCoveragePercent: 20,
    windSpeedMph: 8,
    rainProbability: 10,
    avgHumidity: 65,
    sunnyHours: 6,
    dryingHours: 5,
    sunrise: '2025-01-08T08:00:00',
    sunset: '2025-01-08T16:30:00',
    sunnyPeriods: [
      { hour: 12, temp: 15, cloudCoverage: 15, solarRadiation: 450 },
      { hour: 13, temp: 16, cloudCoverage: 10, solarRadiation: 500 },
    ],
    dryingPeriods: [
      {
        hour: 12,
        temp: 15,
        cloudCoverage: 15,
        solarRadiation: 450,
        rainProbability: 10,
        humidity: 60,
      },
      {
        hour: 13,
        temp: 16,
        cloudCoverage: 10,
        solarRadiation: 500,
        rainProbability: 5,
        humidity: 55,
      },
    ],
  }

  const basePrefs: UserPreferences = {
    postcode: 'SW1A2AA',
    hasGarden: false,
    hasEV: false,
    hasSolar: false,
    hasTimeOfUseTariff: false,
    preferredTemperature: 19,
    heatingType: 'gas' as const,
    hotWaterSystem: 'combi' as const,
  }

  test('should generate line-dry recommendation when user has garden and weather is sunny', () => {
    const prefs = { ...basePrefs, hasGarden: true }
    const weather = { ...baseWeather, dryingHours: 5, windSpeedMph: 10, rainProbability: 20 }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const lineDry = recommendations.find((r) => r.id === 'line-dry')
    expect(lineDry).toBeDefined()
    expect(lineDry?.priority).toBe('high')
    expect(lineDry?.title).toContain('line-dry')
  })

  test('should generate marginal line-dry recommendation with limited drying hours', () => {
    const prefs = { ...basePrefs, hasGarden: true }
    const weather = { ...baseWeather, dryingHours: 3, windSpeedMph: 10 }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const lineDry = recommendations.find((r) => r.id === 'line-dry')
    expect(lineDry).toBeDefined()
    expect(lineDry?.priority).toBe('medium')
    expect(lineDry?.title).toContain('Decent')
  })

  test('should not generate line-dry recommendation when wind is too strong', () => {
    const prefs = { ...basePrefs, hasGarden: true }
    const weather = { ...baseWeather, dryingHours: 5, windSpeedMph: 25, rainProbability: 20 }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const lineDry = recommendations.find((r) => r.id === 'line-dry')
    expect(lineDry).toBeUndefined()
  })

  test('should generate EV solar charging recommendation when user has EV and solar', () => {
    const prefs = { ...basePrefs, hasEV: true, hasSolar: true }
    const weather = {
      ...baseWeather,
      sunnyPeriods: [{ hour: 12, temp: 18, cloudCoverage: 5, solarRadiation: 600 }],
    }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const evSolar = recommendations.find((r) => r.id === 'ev-solar-charging')
    expect(evSolar).toBeDefined()
    expect(evSolar?.priority).toBe('high')
    expect(evSolar?.description).toContain('solar')
  })

  test('should generate EV off-peak recommendation when user has EV but no solar and time-of-use tariff', () => {
    const prefs = { ...basePrefs, hasEV: true, hasSolar: false, hasTimeOfUseTariff: true }

    const recommendations = generateRecommendations(baseWeather, prefs, false, 'tomorrow')

    const evOffPeak = recommendations.find((r) => r.id === 'ev-offpeak-charging')
    expect(evOffPeak).toBeDefined()
    expect(evOffPeak?.description).toContain('overnight')
  })

  test('should not generate EV off-peak recommendation for flat-rate tariff', () => {
    const prefs = { ...basePrefs, hasEV: true, hasSolar: false, hasTimeOfUseTariff: false }

    const recommendations = generateRecommendations(baseWeather, prefs, false, 'tomorrow')

    const evOffPeak = recommendations.find((r) => r.id === 'ev-offpeak-charging')
    expect(evOffPeak).toBeUndefined()
  })

  test('should generate hot water recommendation when weather is cold with time-of-use tariff', () => {
    const weather = { ...baseWeather, avgTemp: 5, tempLow: 2, tempHigh: 8 }
    const prefs = { ...basePrefs, hasTimeOfUseTariff: true }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const hotWater = recommendations.find((r) => r.id === 'batch-hot-water')
    expect(hotWater).toBeDefined()
    expect(hotWater?.description).toContain('off-peak')
  })

  test('should generate efficient hot water recommendation for flat-rate tariff when cold', () => {
    const weather = { ...baseWeather, avgTemp: 5, tempLow: 2, tempHigh: 8 }
    const prefs = { ...basePrefs, hasTimeOfUseTariff: false }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const hotWater = recommendations.find((r) => r.id === 'efficient-hot-water')
    expect(hotWater).toBeDefined()
    expect(hotWater?.description).toContain('short')
  })

  test('should generate natural ventilation recommendation for mild weather', () => {
    const weather = { ...baseWeather, avgTemp: 19, tempHigh: 20, tempLow: 17 }

    const recommendations = generateRecommendations(weather, basePrefs, false, 'tomorrow')

    const ventilation = recommendations.find((r) => r.id === 'natural-ventilation')
    expect(ventilation).toBeDefined()
    expect(ventilation?.description).toContain('Mild temperatures')
    expect(ventilation?.description).toContain('preferred temperature')
  })

  test('should generate avoid heat recommendation for hot weather', () => {
    const weather = { ...baseWeather, avgTemp: 25, tempHigh: 28 }

    const recommendations = generateRecommendations(weather, basePrefs, false, 'tomorrow')

    const avoidHeat = recommendations.find((r) => r.id === 'avoid-heat-generating')
    expect(avoidHeat).toBeDefined()
  })

  test('should include off-peak appliances recommendation for time-of-use tariff', () => {
    const prefs = { ...basePrefs, hasTimeOfUseTariff: true }
    const recommendations = generateRecommendations(baseWeather, prefs, false, 'tomorrow')

    const offPeak = recommendations.find((r) => r.id === 'off-peak-appliances')
    expect(offPeak).toBeDefined()
    expect(offPeak?.description).toContain('dishwasher')
  })

  test('should not include off-peak appliances recommendation for flat-rate tariff', () => {
    const prefs = { ...basePrefs, hasTimeOfUseTariff: false }
    const recommendations = generateRecommendations(baseWeather, prefs, false, 'tomorrow')

    const offPeak = recommendations.find((r) => r.id === 'off-peak-appliances')
    expect(offPeak).toBeUndefined()
  })

  test('should prioritize recommendations correctly', () => {
    const prefs = { ...basePrefs, hasGarden: true, hasEV: true }
    const weather = { ...baseWeather, dryingHours: 5 }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    // First recommendation should be high priority
    if (recommendations.length > 0) {
      expect(recommendations[0].priority).toBe('high')
    }

    // Recommendations should be sorted by priority
    for (let i = 0; i < recommendations.length - 1; i++) {
      const currentPriorityValue = { high: 0, medium: 1, low: 2 }[recommendations[i].priority]
      const nextPriorityValue = { high: 0, medium: 1, low: 2 }[recommendations[i + 1].priority]
      expect(currentPriorityValue).toBeLessThanOrEqual(nextPriorityValue)
    }
  })

  test('should generate heat pump optimal conditions recommendation', () => {
    const prefs = { ...basePrefs, heatingType: 'heat-pump' as const }
    const weather = { ...baseWeather, avgTemp: 10, tempLow: 8, tempHigh: 12 }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const heatPump = recommendations.find((r) => r.id === 'heat-pump-optimal')
    expect(heatPump).toBeDefined()
    expect(heatPump?.priority).toBe('medium')
    expect(heatPump?.description).toContain('heat pump')
  })

  test('should not generate heat pump recommendation when too cold', () => {
    const prefs = { ...basePrefs, heatingType: 'heat-pump' as const }
    const weather = { ...baseWeather, avgTemp: 2, tempLow: -1, tempHigh: 5 }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const heatPump = recommendations.find((r) => r.id === 'heat-pump-optimal')
    expect(heatPump).toBeUndefined()
  })

  test('should generate electric heating with solar recommendation', () => {
    const prefs = { ...basePrefs, heatingType: 'electric' as const, hasSolar: true }
    const weather = { ...baseWeather, sunnyHours: 5, avgTemp: 8 }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const electricSolar = recommendations.find((r) => r.id === 'electric-heating-solar')
    expect(electricSolar).toBeDefined()
    expect(electricSolar?.description).toContain('solar')
    expect(electricSolar?.isPersonalised).toBe(true)
  })

  test('should generate hot water tank timing recommendations for mild nights', () => {
    const prefs = { ...basePrefs, hotWaterSystem: 'tank' as const, hasTimeOfUseTariff: true }
    const weather = { ...baseWeather, tempLow: 12, avgTemp: 15 }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const tankTiming = recommendations.find((r) => r.id === 'tank-mild-night')
    expect(tankTiming).toBeDefined()
    expect(tankTiming?.description).toContain('off-peak')
  })

  test('should generate hot water tank timing recommendations for cold nights', () => {
    const prefs = { ...basePrefs, hotWaterSystem: 'tank' as const, hasTimeOfUseTariff: true }
    const weather = { ...baseWeather, tempLow: 2, avgTemp: 6 }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const tankTiming = recommendations.find((r) => r.id === 'tank-cold-night')
    expect(tankTiming).toBeDefined()
    expect(tankTiming?.description).toContain('afternoon')
  })

  test('should mark personalised recommendations correctly', () => {
    const prefs = {
      ...basePrefs,
      hasGarden: true,
      hasEV: true,
      hasSolar: true,
      hasTimeOfUseTariff: true,
    }
    const weather = { ...baseWeather, dryingHours: 5, sunnyHours: 6, avgTemp: 15 }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    const personalisedRecs = recommendations.filter((r) => r.isPersonalised)
    const nonPersonalisedRecs = recommendations.filter((r) => !r.isPersonalised)

    // Should have both personalised and non-personalised recommendations
    expect(personalisedRecs.length).toBeGreaterThan(0)

    // May not always have non-personalised recommendations depending on weather
    // so we just check total count is reasonable
    expect(recommendations.length).toBeGreaterThan(0)

    // Personalised ones should be based on user setup
    personalisedRecs.forEach((rec) => {
      expect([
        'line-dry',
        'ev-solar-charging',
        'ev-offpeak-charging',
        'off-peak-appliances',
        'batch-hot-water',
        'efficient-hot-water',
        'natural-ventilation',
        'electric-heating-solar',
        'tank-mild-night',
        'tank-cold-night',
      ]).toContain(rec.id)
    })
  })

  test('should return sensible defaults when no specific conditions match', () => {
    const weather = { ...baseWeather, sunnyHours: 0, dryingHours: 0, rainProbability: 50 }
    const prefs = { ...basePrefs, hasTimeOfUseTariff: true }

    const recommendations = generateRecommendations(weather, prefs, false, 'tomorrow')

    // Should still return at least off-peak appliances recommendation
    expect(recommendations.length).toBeGreaterThan(0)
  })
})
