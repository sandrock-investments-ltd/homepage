import { test, expect } from '../fixtures/test-fixtures'

test.describe('Landlord Invitations', () => {
  test.describe('Given a landlord is signed in and has a property', () => {
    test('Then they should see their existing invitations', async ({ loginAsLandlord }) => {
      const page = loginAsLandlord

      await page.getByRole('link', { name: 'Invitations' }).click()
      await page.waitForURL('**/landlord/invitations')

      await expect(page.getByText('New Renter')).toBeVisible()
      await expect(page.getByText('pending')).toBeVisible()
    })

    test('When they invite a new renter, then the invitation should appear with a pending badge', async ({ loginAsLandlord }) => {
      const page = loginAsLandlord

      await page.getByRole('link', { name: 'Invitations' }).click()
      await page.waitForURL('**/landlord/invitations')

      await page.getByRole('button', { name: 'Invite Renter' }).click()
      await page.locator('select[name="property_id"]').selectOption({ index: 1 })
      await page.getByLabel('Renter Email').fill('newperson@test.com')
      await page.getByLabel('Renter Name').fill('New Person')

      await page.getByRole('button', { name: 'Send Invitation' }).click()

      await expect(page.getByText('New Person')).toBeVisible()
      await expect(page.getByText('newperson@test.com')).toBeVisible()
    })
  })
})
