import { test as base, expect, type Page } from '@playwright/test'

// Extend window type for mock store access
declare global {
  interface Window {
    __mockStore: {
      reset: () => void
      seed: (scenario: string) => void
    }
  }
}

export const test = base.extend<{
  seedScenario: string
  resetMock: void
  loginAsLandlord: Page
  loginAsRenter: Page
}>({
  // Default seed scenario — tests can override with test.use({ seedScenario: 'fresh-renter' })
  seedScenario: 'default',

  // Automatically reset and seed before each test, using the configured scenario
  resetMock: [async ({ page, seedScenario }, use) => {
    // Set init script so every page load in this test uses the right scenario
    await page.addInitScript((scenario) => {
      (globalThis as unknown as Record<string, unknown>).__sandrockMockSeedOverride = scenario
    }, seedScenario)

    await page.goto('/')
    await page.waitForFunction(() => !!(window as unknown as Record<string, unknown>).__mockStore)
    await page.evaluate((scenario) => {
      window.__mockStore.reset()
      window.__mockStore.seed(scenario)
    }, seedScenario)
    await use()
  }, { auto: true }],

  // Login as landlord and return page at /landlord/properties
  loginAsLandlord: async ({ page }, use) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('riyad@sandrock.test')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/landlord/properties')
    await use(page)
  },

  // Login as renter and return page at /renter/onboarding
  loginAsRenter: async ({ page }, use) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('jane@renter.test')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/renter/onboarding')
    await use(page)
  },
})

export { expect }
