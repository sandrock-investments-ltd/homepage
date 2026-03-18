import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().optional(),
    role: z.enum(['landlord', 'renter'], 'Please select a role'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const propertySchema = z.object({
  address_line_1: z.string().min(1, 'Address is required'),
  address_line_2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  property_type: z.enum(['house', 'flat', 'studio', 'room'], 'Please select a property type'),
  bedrooms: z
    .number('Number of bedrooms is required')
    .int('Bedrooms must be a whole number')
    .min(0, 'Bedrooms cannot be negative'),
  house_rules: z.string().optional(),
})

export const invitationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  renter_name: z.string().optional(),
  lease_start: z.string().optional(),
  rent_amount_pence: z
    .number('Rent amount must be a number')
    .int('Rent amount must be a whole number in pence')
    .min(0, 'Rent amount cannot be negative')
    .optional(),
})

export const documentUploadSchema = z.object({
  category: z.string().min(1, 'Please select a document category'),
})

export const documentReviewSchema = z.object({
  review_status: z.enum(['accepted', 'more_info_needed'], 'Please select a review status'),
  review_note: z.string().optional(),
})

// Inferred types
export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type PropertyFormValues = z.infer<typeof propertySchema>
export type InvitationFormValues = z.infer<typeof invitationSchema>
export type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>
export type DocumentReviewFormValues = z.infer<typeof documentReviewSchema>
