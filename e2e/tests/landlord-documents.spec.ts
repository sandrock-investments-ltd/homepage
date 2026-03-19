import { test, expect } from '../fixtures/test-fixtures'

test.describe('Landlord Document Review', () => {
  test.describe('Given a landlord is signed in and a renter has uploaded a pending document', () => {
    test('Then they should see the pending document in the review list', async ({ loginAsLandlord }) => {
      const page = loginAsLandlord

      await page.getByRole('link', { name: 'Documents' }).click()
      await page.waitForURL('**/landlord/documents')

      await expect(page.getByText('passport.pdf')).toBeVisible()
      await expect(page.getByText('Pending')).toBeVisible()
    })

    test('When they accept the document, then the badge should change to Accepted', async ({ loginAsLandlord }) => {
      const page = loginAsLandlord

      await page.getByRole('link', { name: 'Documents' }).click()
      await page.waitForURL('**/landlord/documents')

      // Click Review to expand the review controls
      await page.getByRole('button', { name: 'Review' }).click()

      // Click Accept
      await page.getByRole('button', { name: 'Accept' }).click()

      await expect(page.getByText('Accepted')).toBeVisible()
    })
  })
})
