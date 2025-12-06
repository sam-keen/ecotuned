import { test, expect } from '@playwright/test'

test.describe('Returning user flow', () => {
  test('should remember preferences and show recommendations without form', async ({ page, context }) => {
    // First visit - set up preferences
    await page.goto('/')

    await page.getByLabel('Postcode').fill('SW1A 2AA')
    await page.getByRole('checkbox', { name: /Garden.*Balcony/i }).check()
    await page.getByRole('checkbox', { name: /Electric Vehicle/i }).check()

    await page.getByRole('button', { name: /get my tips/i }).click()
    await page.waitForURL('/')

    // Verify recommendations are shown
    await expect(page.getByRole('button', { name: /^today$/i })).toBeVisible()

    // Second visit - should skip form and show recommendations directly
    await page.goto('/')

    // Should NOT see the setup form
    await expect(page.getByText('Welcome to EcoTuned')).not.toBeVisible()

    // Should see recommendations immediately
    await expect(page.getByRole('button', { name: /^today$/i })).toBeVisible()
    await expect(page.getByText(/SW1A 2AA/)).toBeVisible()

    // Should see "Edit" button
    await expect(page.getByRole('button', { name: /^edit$/i })).toBeVisible()
  })

  test('should maintain preferences across page reloads', async ({ page }) => {
    // Set up preferences
    await page.goto('/')

    await page.getByLabel('Postcode').fill('M1 1AE')
    await page.getByRole('checkbox', { name: /Cycle to Work/i }).check()

    await page.getByRole('button', { name: /get my tips/i }).click()
    await page.waitForURL('/')

    // Wait for dashboard to load
    await expect(page.getByRole('button', { name: /^today$/i })).toBeVisible()

    // Reload page
    await page.reload()

    // Preferences should still be active
    await expect(page.getByRole('button', { name: /^today$/i })).toBeVisible()
    await expect(page.getByText(/M1 1AE/)).toBeVisible()
  })

  test('should persist preferences across browser restart', async ({ browser }) => {
    // Create a new context to simulate browser restart
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()

    // Set up preferences
    await page1.goto('http://localhost:3000')
    await page1.getByLabel('Postcode').fill('SW1A 2AA')
    await page1.getByRole('checkbox', { name: /Garden.*Balcony/i }).check()
    await page1.getByRole('button', { name: /get my tips/i }).click()
    await page1.waitForURL('http://localhost:3000/')

    // Wait for dashboard to load
    await expect(page1.getByRole('button', { name: /^today$/i })).toBeVisible()

    // Get cookies
    const cookies = await context1.cookies()
    await context1.close()

    // Create new context with saved cookies (simulates browser restart)
    const context2 = await browser.newContext()
    await context2.addCookies(cookies)
    const page2 = await context2.newPage()

    // Load page in new context
    await page2.goto('http://localhost:3000')

    // Should see recommendations without form
    await expect(page2.getByRole('button', { name: /^today$/i })).toBeVisible()
    await expect(page2.getByText(/SW1A 2AA/)).toBeVisible()

    await context2.close()
  })
})
