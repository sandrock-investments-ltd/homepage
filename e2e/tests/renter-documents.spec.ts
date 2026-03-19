import { test, expect } from '../fixtures/test-fixtures'
import path from 'path'

test.describe('Renter Documents', () => {
  test.describe('Given a renter is signed in with an active tenancy', () => {
    test('Then they should see their existing documents', async ({ loginAsRenter }) => {
      const page = loginAsRenter

      await page.getByRole('link', { name: 'My Documents' }).click()
      await page.waitForURL('**/renter/my-documents')

      await expect(page.getByText('passport.pdf')).toBeVisible()
      await expect(page.getByText('Pending Review')).toBeVisible()
    })

    test('When they upload a new document, then it should appear with a Pending Review badge', async ({ loginAsRenter }) => {
      const page = loginAsRenter

      await page.getByRole('link', { name: 'My Documents' }).click()
      await page.waitForURL('**/renter/my-documents')

      // Select category and file
      await page.locator('select').selectOption('proof_of_address')

      const fileInput = page.locator('#file-upload')
      await fileInput.setInputFiles(path.join(__dirname, '..', 'fixtures', 'test-file.pdf'))

      await page.getByRole('button', { name: 'Upload' }).click()

      await expect(page.getByText('test-file.pdf')).toBeVisible()
      await expect(page.getByText('Pending Review').first()).toBeVisible()
    })
  })
})
