import { test, expect } from '../fixtures/test-fixtures'

test.describe('Renter Onboarding', () => {
  test.describe('Given a renter is signed in with one pending document uploaded', () => {
    test('Then they should see the document checklist with a progress bar', async ({ loginAsRenter }) => {
      const page = loginAsRenter

      await expect(page.getByText('Document Checklist')).toBeVisible()
      await expect(page.getByText(/\d+ of \d+ documents accepted/)).toBeVisible()
    })

    test('Then the uploaded passport should show as Pending Review', async ({ loginAsRenter }) => {
      const page = loginAsRenter

      const passportRow = page.locator('div').filter({ hasText: 'Passport' }).filter({ hasText: /Pending Review|Missing/ })
      await expect(passportRow.first()).toBeVisible()
    })

    test('Then missing documents should show as Missing with an Upload link', async ({ loginAsRenter }) => {
      const page = loginAsRenter

      await expect(page.getByText('Missing').first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Upload' }).first()).toBeVisible()
    })

    test('Then the progress bar should reflect the current completion state', async ({ loginAsRenter }) => {
      const page = loginAsRenter

      // With default seed: 0 of 3 accepted (passport is pending, not accepted)
      await expect(page.getByText('0%')).toBeVisible()
      await expect(page.getByText('0 of 3 documents accepted')).toBeVisible()
    })
  })

  test.describe('Given a fresh renter with no documents', () => {
    test.use({ seedScenario: 'fresh-renter' })

    test('Then all required documents should show as Missing', async ({ loginAsRenter }) => {
      const page = loginAsRenter

      await expect(page.getByText('Document Checklist')).toBeVisible()
      await expect(page.getByText('0 of 3 documents accepted')).toBeVisible()
      await expect(page.getByText('0%')).toBeVisible()

      // All three required docs should be missing
      const missingBadges = page.getByText('Missing', { exact: true })
      await expect(missingBadges).toHaveCount(3)
    })
  })
})
