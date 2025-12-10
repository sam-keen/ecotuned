/**
 * Heating system validation utilities
 * Ensures hot water system options are compatible with heating types
 */

/**
 * Returns valid hot water system options based on heating type
 * Based on UK heating system compatibility
 *
 * @param heatingType - The selected heating type
 * @returns Array of valid hot water system option values
 */
export function getValidHotWaterOptions(heatingType: string): string[] {
  switch (heatingType) {
    case 'gas':
      // Gas boilers can be combi (instant) or tank-based
      return ['combi', 'tank', 'other']

    case 'electric':
      // Electric heating doesn't use combi boilers (which are gas-specific)
      return ['tank', 'electric', 'other']

    case 'heat-pump':
      // Heat pumps typically work with hot water tanks, not combi boilers
      return ['tank', 'other']

    case 'oil':
      // Oil boilers work with tanks, not combi systems
      return ['tank', 'other']

    case 'other':
      // Allow all options for "other" heating types
      return ['combi', 'tank', 'electric', 'other']

    default:
      // Default: allow all options
      return ['combi', 'tank', 'electric', 'other']
  }
}

/**
 * Validates whether a heating type and hot water system combination is valid
 *
 * @param heatingType - The selected heating type
 * @param hotWaterSystem - The selected hot water system
 * @returns true if the combination is valid, false otherwise
 */
export function isValidHeatingCombination(heatingType: string, hotWaterSystem: string): boolean {
  const validOptions = getValidHotWaterOptions(heatingType)
  return validOptions.includes(hotWaterSystem)
}
