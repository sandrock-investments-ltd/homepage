import { test, expect } from '../fixtures/test-fixtures'

test.describe('Landlord Properties', () => {
  test.describe('Given a landlord is signed in with an existing property', () => {
    test('Then they should see their property listed', async ({ loginAsLandlord }) => {
      await expect(loginAsLandlord.getByText('42 Brick Lane')).toBeVisible()
      await expect(loginAsLandlord.getByText('London, E1 6RF')).toBeVisible()
    })
  })

  test.describe('Given a landlord wants to add a new property', () => {
    test('When they fill in the add property form and submit, then the new property should appear in the list', async ({ loginAsLandlord }) => {
      const page = loginAsLandlord

      await page.getByRole('button', { name: 'Add Property' }).click()
      await page.getByLabel('Address Line 1').fill('10 Downing Street')
      await page.getByLabel('City').fill('London')
      await page.getByLabel('Postcode').fill('SW1A 2AA')
      await page.locator('select[name="property_type"]').selectOption('house')
      await page.getByLabel('Bedrooms').fill('3')

      await page.getByRole('button', { name: 'Add Property' }).last().click()

      await expect(page.getByText('10 Downing Street')).toBeVisible()
      await expect(page.getByText('London, SW1A 2AA')).toBeVisible()
    })
  })
})
