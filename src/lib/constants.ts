export const RENTER_DOCUMENT_CATEGORIES = [
  { value: 'passport', label: 'Passport' },
  { value: 'driving_licence', label: 'Driving Licence' },
  { value: 'national_id', label: 'National ID' },
  { value: 'proof_of_address', label: 'Proof of Address' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'payslip', label: 'Payslip' },
  { value: 'employment_contract', label: 'Employment Contract' },
  { value: 'credit_check', label: 'Credit Check' },
  { value: 'guarantor_details', label: 'Guarantor Details' },
  { value: 'visa_brp', label: 'Visa / BRP' },
] as const

export const LANDLORD_DOCUMENT_CATEGORIES = [
  { value: 'tenancy_agreement', label: 'Tenancy Agreement' },
  { value: 'government_info_sheet', label: 'Government Info Sheet' },
  { value: 'epc', label: 'Energy Performance Certificate (EPC)' },
  { value: 'gas_safety_cert', label: 'Gas Safety Certificate' },
  { value: 'eicr', label: 'Electrical Installation Condition Report (EICR)' },
  { value: 'deposit_protection_cert', label: 'Deposit Protection Certificate' },
  { value: 'house_rules', label: 'House Rules' },
] as const

export const ALL_DOCUMENT_CATEGORIES = [...RENTER_DOCUMENT_CATEGORIES, ...LANDLORD_DOCUMENT_CATEGORIES] as const

export const REQUIRED_RENTER_DOCUMENTS = [
  'passport',
  'proof_of_address',
  'payslip',
] as const

export const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'flat', label: 'Flat' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Room' },
] as const
