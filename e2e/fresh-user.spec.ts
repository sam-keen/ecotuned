import { test, expect } from '@playwright/test'

test.describe('Fresh user flow', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies before each test to simulate fresh user
    await context.clearCookies()
  })

  test('should show setup form for new user and display recommendations after submission', async ({
    page,
  }) => {
    await page.goto('/')

    // Verify setup form is displayed
    await expect(page.getByText('Welcome to EcoTuned')).toBeVisible()
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()

    // Fill in postcode
    await page.getByLabel('Postcode').fill('SW1A 2AA')

    // Check garden checkbox
    await page.getByRole('checkbox', { name: /Garden.*Balcony/i }).check()

    // Check EV checkbox
    await page.getByRole('checkbox', { name: /Electric Vehicle/i }).check()

    // Leave cycling unchecked
    // Leave solar unchecked

    // Submit form
    await page.getByRole('button', { name: /get my tips/i }).click()

    // Wait for navigation and recommendations to load
    await page.waitForURL('/')

    // Verify recommendations are displayed
    await expect(page.getByRole('button', { name: /^today$/i })).toBeVisible()

    // Should see at least one recommendation
    await expect(page.getByText(/#1 Priority/i)).toBeVisible()

    // Verify weather summary is shown
    await expect(page.getByText(/°C/).first()).toBeVisible()

    // Verify postcode is displayed
    await expect(page.getByText(/SW1A 2AA/)).toBeVisible()
  })

  test('should show validation errors for invalid postcode', async ({ page }) => {
    await page.goto('/')

    // Fill in invalid postcode
    await page.getByLabel('Postcode').fill('INVALID123')

    // Submit form
    await page.getByRole('button', { name: /get my tips/i }).click()

    // Should see validation error
    await expect(page.getByText(/Invalid UK postcode format/i)).toBeVisible()

    // Should still be on the same page with form visible
    await expect(page.getByText('Welcome to EcoTuned')).toBeVisible()
  })

  test('should show validation error for empty postcode', async ({ page }) => {
    await page.goto('/')

    // Leave postcode empty
    await page.getByRole('checkbox', { name: /Garden.*Balcony/i }).check()

    // Submit form
    await page.getByRole('button', { name: /get my tips/i }).click()

    // Should see validation error
    await expect(page.getByText(/Postcode is required/i)).toBeVisible()
  })

  test('should work with different preference combinations', async ({ page }) => {
    await page.goto('/')

    // Fill in postcode
    await page.getByLabel('Postcode').fill('M1 1AE')

    // Check all preferences
    await page.getByRole('checkbox', { name: /Garden.*Balcony/i }).check()
    await page.getByRole('checkbox', { name: /Electric Vehicle/i }).check()
    await page.getByRole('checkbox', { name: /Cycle to Work/i }).check()
    await page.getByRole('checkbox', { name: /Solar Panels/i }).check()

    // Submit form
    await page.getByRole('button', { name: /get my tips/i }).click()

    // Wait for recommendations
    await page.waitForURL('/')

    // Verify recommendations are displayed
    await expect(page.getByRole('button', { name: /^today$/i })).toBeVisible()
    await expect(page.getByText(/M1 1AE/)).toBeVisible()
  })
})
