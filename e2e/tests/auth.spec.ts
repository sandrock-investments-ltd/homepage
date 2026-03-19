import { test, expect } from '../fixtures/test-fixtures'

test.describe('Authentication', () => {
  test.describe('Given a landlord with valid credentials', () => {
    test('When they sign in, then they should be redirected to properties page', async ({ loginAsLandlord }) => {
      await expect(loginAsLandlord).toHaveURL(/landlord\/properties/)
    })

    test('When they sign in, then the navigation should show their name', async ({ loginAsLandlord }) => {
      await expect(loginAsLandlord.getByText('Riyad Attani')).toBeVisible()
    })

    test('When they sign in, then the navigation should show the landlord role badge', async ({ loginAsLandlord }) => {
      await expect(loginAsLandlord.getByText('landlord')).toBeVisible()
    })
  })

  test.describe('Given a renter with valid credentials', () => {
    test('When they sign in, then they should be redirected to onboarding page', async ({ loginAsRenter }) => {
      await expect(loginAsRenter).toHaveURL(/renter\/onboarding/)
    })

    test('When they sign in, then the navigation should show their name', async ({ loginAsRenter }) => {
      await expect(loginAsRenter.getByText('Jane Smith')).toBeVisible()
    })
  })

  test.describe('Given invalid credentials', () => {
    test('When a user enters the wrong password, then an error message should be shown', async ({ page }) => {
      await page.goto('/login')
      await page.getByLabel('Email').fill('riyad@sandrock.test')
      await page.getByLabel('Password').fill('wrongpassword')
      await page.getByRole('button', { name: 'Sign In' }).click()

      await expect(page.getByText('Invalid login credentials')).toBeVisible()
      await expect(page).toHaveURL(/login/)
    })
  })
})
