/**
 * Maps weather conditions to their corresponding color palette
 * Based on WMO weather codes and eco color system
 */

export interface WeatherColorPalette {
  primary: string
  secondary: string
  accent: string
  name: 'sunny' | 'cloudy' | 'foggy' | 'rainy' | 'snowy' | 'stormy'
}

const COLOR_PALETTES: Record<string, WeatherColorPalette> = {
  sunny: {
    primary: '#F4A261',
    secondary: '#FFD93D',
    accent: '#FFB5A7',
    name: 'sunny',
  },
  cloudy: {
    primary: '#A8DADC',
    secondary: '#D4D8DD',
    accent: '#B3E5FC',
    name: 'cloudy',
  },
  foggy: {
    primary: '#B0B8C1',
    secondary: '#C4CFC9',
    accent: '#E8EAED',
    name: 'foggy',
  },
  rainy: {
    primary: '#457B9D',
    secondary: '#6B8E9F',
    accent: '#81B29A',
    name: 'rainy',
  },
  snowy: {
    primary: '#C9E4F5',
    secondary: '#E8F4F8',
    accent: '#AED9E0',
    name: 'snowy',
  },
  stormy: {
    primary: '#5A4A6F',
    secondary: '#3D3D3D',
    accent: '#4A90A4',
    name: 'stormy',
  },
}

/**
 * Get weather color palette based on WMO weather code
 * @param weatherCode - WMO weather code (0-99)
 * @returns Color palette object with primary, secondary, accent colors
 */
export function getWeatherColors(weatherCode: number): WeatherColorPalette {
  // Clear sky / Sunny
  if (weatherCode === 0 || weatherCode === 1) {
    return COLOR_PALETTES.sunny
  }

  // Partly cloudy
  if (weatherCode === 2 || weatherCode === 3) {
    return COLOR_PALETTES.cloudy
  }

  // Fog
  if (weatherCode === 45 || weatherCode === 48) {
    return COLOR_PALETTES.foggy
  }

  // Drizzle, Rain, Showers
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    return COLOR_PALETTES.rainy
  }

  // Snow
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return COLOR_PALETTES.snowy
  }

  // Thunderstorm
  if ([95, 96, 99].includes(weatherCode)) {
    return COLOR_PALETTES.stormy
  }

  // Default to cloudy for unknown codes
  return COLOR_PALETTES.cloudy
}

/**
 * Get Tailwind CSS classes for weather-dependent styling
 * @param weatherCode - WMO weather code
 * @returns Object with Tailwind class names for common elements
 */
export function getWeatherClasses(weatherCode: number) {
  const palette = getWeatherColors(weatherCode)

  return {
    // Card backgrounds
    cardBg: `bg-eco-${palette.name}-secondary/20`,
    cardBorder: `border-eco-${palette.name}-primary`,

    // Badges
    badge: `bg-eco-${palette.name}-primary text-eco-white border-eco-${palette.name}-primary`,

    // Buttons
    button: `bg-eco-${palette.name}-primary hover:bg-eco-${palette.name}-accent border-eco-${palette.name}-primary`,

    // Text colors
    textPrimary: `text-eco-${palette.name}-primary`,
    textAccent: `text-eco-${palette.name}-accent`,
  }
}
