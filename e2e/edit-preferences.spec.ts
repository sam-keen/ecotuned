import { test, expect } from '@playwright/test'

test.describe('Edit preferences flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up initial preferences
    await page.goto('/')
    await page.getByLabel('Postcode').fill('SW1A 2AA')
    await page.getByRole('checkbox', { name: /Garden.*Balcony/i }).check()
    await page.getByRole('button', { name: /get my tips/i }).click()
    await page.waitForURL('/')
  })

  test('should open edit modal when clicking edit preferences', async ({ page }) => {
    // Click edit preferences button
    await page.getByRole('button', { name: /^edit$/i }).click()

    // Modal should be visible
    await expect(page.getByText('Edit Preferences')).toBeVisible()

    // Form fields should be pre-filled with current values
    const postcodeInput = page.getByLabel('Postcode')
    await expect(postcodeInput).toHaveValue('SW1A2AA')

    const gardenCheckbox = page.getByRole('checkbox', { name: /Garden.*Balcony/i })
    await expect(gardenCheckbox).toBeChecked()
  })

  test('should update preferences and show new recommendations', async ({ page }) => {
    // Open edit modal
    await page.getByRole('button', { name: /^edit$/i }).click()

    // Change postcode
    const postcodeInput = page.getByLabel('Postcode')
    await postcodeInput.fill('M1 1AE')

    // Toggle solar panels on
    await page.getByRole('checkbox', { name: /Solar Panels/i }).check()

    // Toggle EV on
    await page.getByRole('checkbox', { name: /Electric Vehicle/i }).check()

    // Save changes
    await page.getByRole('button', { name: /^save$/i }).click()

    // Should redirect back to main page
    await page.waitForURL('/')

    // New postcode should be displayed
    await expect(page.getByText(/M1 1AE/)).toBeVisible()

    // Recommendations should be updated (will depend on weather, but page should reload)
    await expect(page.getByRole('button', { name: /^today$/i })).toBeVisible()
  })

  test('should close modal when clicking X button', async ({ page }) => {
    // Open edit modal
    await page.getByRole('button', { name: /^edit$/i }).click()

    // Modal should be visible
    await expect(page.getByText('Edit Preferences')).toBeVisible()

    // Click X button (close button)
    await page.getByRole('button', { name: 'Close' }).click()

    // Wait for modal to close (animation)
    await page.waitForTimeout(300)

    // Modal should be hidden
    await expect(page.getByText('Edit Preferences')).not.toBeVisible()

    // Should still see original recommendations
    await expect(page.getByRole('button', { name: /^today$/i })).toBeVisible()
  })

  test('should show validation errors in edit modal', async ({ page }) => {
    // Open edit modal
    await page.getByRole('button', { name: /^edit$/i }).click()

    // Clear postcode
    const postcodeInput = page.getByLabel('Postcode')
    await postcodeInput.fill('INVALID')

    // Try to save
    await page.getByRole('button', { name: /^save$/i }).click()

    // Should see validation error
    await expect(page.getByText(/Invalid UK postcode format/i)).toBeVisible()

    // Modal should still be open
    await expect(page.getByText('Edit Preferences')).toBeVisible()
  })

  test('should clear all preferences when clicking clear all', async ({ page }) => {
    // Open edit modal
    await page.getByRole('button', { name: /^edit$/i }).click()

    // Click clear button
    await page.getByRole('button', { name: /^clear$/i }).click()

    // Confirmation modal should appear
    await expect(page.getByText('Clear All Data?')).toBeVisible()

    // Click Yes, Clear All
    await page.getByRole('button', { name: /Yes, Clear All/i }).click()

    // Should redirect to setup form
    await page.waitForURL('/')
    await expect(page.getByText('Welcome to EcoTuned')).toBeVisible()

    // Setup form should be displayed
    await expect(page.getByLabel('Postcode')).toBeVisible()
  })

  test('should cancel clear all when dismissing confirmation', async ({ page }) => {
    // Open edit modal
    await page.getByRole('button', { name: /^edit$/i }).click()

    // Click clear button
    await page.getByRole('button', { name: /^clear$/i }).click()

    // Confirmation modal should appear
    await expect(page.getByText('Clear All Data?')).toBeVisible()

    // Click Cancel
    await page.getByRole('button', { name: /^cancel$/i }).click()

    // Should stay in edit modal
    await expect(page.getByText('Edit Preferences')).toBeVisible()
  })

  test('should auto-reset hot water system when changing from gas to electric heating', async ({
    page,
  }) => {
    // Open edit modal
    await page.getByRole('button', { name: /^edit$/i }).click()

    // Heating should default to gas and hot water to combi
    const heatingSelect = page.getByLabel('Heating Type')
    const hotWaterSelect = page.getByLabel('Hot Water System')

    // Verify initial state (gas allows combi)
    await expect(heatingSelect).toHaveValue('gas')

    // Change to electric heating
    await heatingSelect.selectOption('electric')

    // Wait a moment for the form to react
    await page.waitForTimeout(100)

    // Verify combi boiler option is no longer available
    const options = await hotWaterSelect.locator('option').allTextContents()
    expect(options.some((opt) => opt.includes('Combi'))).toBe(false)

    // Hot water should have auto-reset to a valid option (tank or electric)
    const currentValue = await hotWaterSelect.inputValue()
    expect(['tank', 'electric', 'other']).toContain(currentValue)

    // Save changes
    await page.getByRole('button', { name: /^save$/i }).click()

    // Should redirect back to main page
    await page.waitForURL('/')

    // Verify recommendations are displayed
    await expect(page.getByRole('button', { name: /^today$/i })).toBeVisible()
  })
})
