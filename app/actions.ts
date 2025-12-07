'use server'

import { cookies } from 'next/headers'
import { userPreferencesSchema } from '@/lib/schemas'

const COOKIE_NAME = 'ecotuned_prefs'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/**
 * Server action to save user preferences
 * Validates input and stores in httpOnly cookie
 */
export async function savePreferences(formData: FormData) {
  try {
    // Extract and parse form data
    const rawData = {
      postcode: formData.get('postcode') as string,
      hasGarden: formData.get('hasGarden') === 'true',
      hasEV: formData.get('hasEV') === 'true',
      hasSolar: formData.get('hasSolar') === 'true',
      hasTimeOfUseTariff: formData.get('hasTimeOfUseTariff') === 'true',
      preferredTemperature: Number(formData.get('preferredTemperature')) || 19,
      heatingType: (formData.get('heatingType') as string) || 'gas',
      hotWaterSystem: (formData.get('hotWaterSystem') as string) || 'combi',
    }

    // Validate with Zod schema
    const validatedData = userPreferencesSchema.parse(rawData)

    // Store in httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, JSON.stringify(validatedData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return { success: true }
  } catch (error) {
    console.error('Error saving preferences:', error)
    throw new Error('Failed to save preferences. Please check your input and try again.')
  }
}

/**
 * Server action to clear user preferences
 */
export async function clearPreferences() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  return { success: true }
}

/**
 * Get user preferences from cookie
 */
export async function getPreferences() {
  try {
    const cookieStore = await cookies()
    const prefsCookie = cookieStore.get(COOKIE_NAME)

    if (!prefsCookie) {
      return null
    }

    const parsed = JSON.parse(prefsCookie.value)
    const validated = userPreferencesSchema.parse(parsed)
    return validated
  } catch (error) {
    console.error('Error reading preferences:', error)
    return null
  }
}
