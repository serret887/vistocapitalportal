// Partner Types
export type PartnerTypeValue = 'wholesaler' | 'investor' | 'real_estate_agent' | 'marketing_partner'
export type PartnerType = 'Wholesaler' | 'Investor' | 'Real Estate Agent' | 'Marketing Partner'

export const PARTNER_TYPES: PartnerType[] = [
  'Wholesaler',
  'Investor', 
  'Real Estate Agent',
  'Marketing Partner'
]

export interface PartnerProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  partner_type: string
  phone_number?: string
  monthly_deal_volume?: number
  transaction_volume?: number
  transaction_types: string[]
  license_number?: string
  license_state?: string
  onboarded: boolean
  created_at: string
}

export interface OnboardingFormData {
  first_name: string
  last_name: string
  email: string
  partner_type: string
  phone_number: string
  monthly_deal_volume: number
  transaction_volume: number
  transaction_types: string[]
  license_number?: string
  license_state?: string
}

// Transaction Types
export type TransactionType = 'Fix and Flip' | 'Long Term Rental' | 'Home Owners' | 'Multifamily' | 'Commercial Properties'

export const TRANSACTION_TYPES: TransactionType[] = [
  'Fix and Flip',
  'Long Term Rental',
  'Home Owners',
  'Multifamily',
  'Commercial Properties'
]

// US States for select dropdowns
export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
  'Wisconsin', 'Wyoming'
]

// Phase 2: Enhanced Loan Application Types
export type LoanApplicationStatus = 
  | 'in_review' 
  | 'approved' 
  | 'ineligible' 
  | 'denied' 
  | 'closed' 
  | 'missing_conditions'
  | 'pending_documents'

export const LOAN_STATUS_LABELS: Record<LoanApplicationStatus, string> = {
  'in_review': 'In Review',
  'approved': 'Approved',
  'ineligible': 'Ineligible', 
  'denied': 'Denied',
  'closed': 'Closed',
  'missing_conditions': 'Missing Conditions',
  'pending_documents': 'Pending Documents'
}

// Updated colors to use Visto Capital brand palette with neutral status colors
export const LOAN_STATUS_COLORS: Record<LoanApplicationStatus, string> = {
  'in_review': 'bg-blue-50 text-blue-800 border-blue-200',
  'approved': 'bg-green-50 text-green-800 border-green-200',
  'ineligible': 'bg-gray-50 text-gray-700 border-gray-200',
  'denied': 'bg-red-50 text-red-800 border-red-200',
  'closed': 'bg-purple-50 text-purple-800 border-purple-200',
  'missing_conditions': 'bg-yellow-50 text-yellow-800 border-yellow-200',
  'pending_documents': 'bg-orange-50 text-orange-800 border-orange-200'
}

// Simplified Loan Application Types
export type LoanObjective = 'refi' | 'purchase'

export const LOAN_OBJECTIVES: { value: LoanObjective; label: string }[] = [
  { value: 'refi', label: 'Refinance' },
  { value: 'purchase', label: 'Purchase' }
]

// Simplified loan types based on objective
export const REFI_LOAN_TYPES = [
  { value: 'dscr', label: 'DSCR (Debt Service Coverage Ratio)' },
  { value: 'homeowner', label: 'Home Owner' }
]

export const PURCHASE_LOAN_TYPES = [
  { value: 'dscr', label: 'DSCR (Debt Service Coverage Ratio)' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'homeowner', label: 'Home Owner' }
]

// Income Types for Home Owner Loans
export type IncomeSourceType = 'w2' | 'self_employed' | 'alimony' | 'ssn' | 'company' | 'other'
export type IncomeDocumentType = 'w2' | 'self_employed' | 'alimony' | 'ssn' | 'company' | 'other' | '1040_tax_return'

export const INCOME_SOURCE_TYPES: { value: IncomeSourceType; label: string }[] = [
  { value: 'w2', label: 'W-2 (Employment Income)' },
  { value: 'self_employed', label: '1099 (Contract/Freelance Income)' },
  { value: 'alimony', label: 'Alimony/Child Support' },
  { value: 'ssn', label: 'Social Security/Disability' },
  { value: 'company', label: 'Business/Company Income' },
  { value: 'other', label: 'Other Income' }
]

export interface IncomeSource {
  id: string
  type: IncomeSourceType
  amount: number
  description: string
  documents: File[] // Documents specific to this income source
}

export interface IncomeDocument {
  id: string
  document_type: IncomeDocumentType
  file_name: string
  file_size: number
  file_url?: string
  income_source_id?: string // Links to IncomeSource (null for 1040 tax return)
  uploaded_at: string
}

export interface BankAccount {
  id: string
  bank_name: string
  account_type: 'checking' | 'savings' | 'money_market' | 'cd' | 'investment'
  balance: number
  statement_months: number
}

export interface BankStatement {
  id: string
  account_id: string
  month: string // Format: YYYY-MM
  file_url: string
  file_name: string
  uploaded_at: string
}

export interface LoanApplication {
  id: string
  user_id: string
  
  // Application-level fields
  application_name?: string
  application_type?: string
  notes?: string
  
  // Status and timestamps
  status: string
  created_at: string
  updated_at: string
  
  // Legacy fields for backward compatibility (these should be moved to loans table)
  dscr_data?: any
  estimated_home_value?: number
  loan_amount?: number
  down_payment_percentage?: number
  monthly_rental_income?: number
  annual_property_insurance?: number
  annual_property_taxes?: number
  monthly_hoa_fee?: number
  is_short_term_rental?: boolean
  property_state?: string
  broker_points?: number
  broker_admin_fee?: number
  broker_ysp?: number
  selected_loan_product?: any
  dscr_results?: any
  fico_score_range?: string
  prepayment_penalty?: string
  discount_points?: number
  transaction_type?: string
  property_zip_code?: string
  property_city?: string
  property_county?: string
  property_occupancy?: string
  property_use?: string
  property_condition?: string
  property_year_built?: number
  property_square_footage?: number
  property_bedrooms?: number
  property_bathrooms?: number
  property_lot_size?: number
  property_zoning?: string
  property_appraisal_value?: number
  property_purchase_price?: number
  property_seller_concessions?: number
  property_closing_costs?: number
  property_repairs_improvements?: number
  property_reserves?: number
  property_escrow_accounts?: boolean
  property_flood_insurance?: number
  property_hazard_insurance?: number
  property_title_insurance?: number
  property_survey_fees?: number
  property_recording_fees?: number
  property_transfer_taxes?: number
  property_other_costs?: number
}

// Extended interface that includes borrower data for backward compatibility
export interface LoanApplicationWithBorrower extends LoanApplication {
  // Borrower information (from clients table)
  first_name?: string
  last_name?: string
  email?: string
  phone_number?: string
  ssn?: string
  date_of_birth?: string
  current_residence?: string
  total_income?: number
  income_sources?: any[]
  total_assets?: number
  bank_accounts?: any[]
  
  // Property information (from loans table)
  property_address?: string
  property_is_tbd?: boolean
  property_type?: string
  loan_objective?: string
  loan_type?: string
}

export interface Loan {
  id: string
  application_id: string
  
  // Loan Basic Information
  loan_name: string
  loan_type: string
  loan_objective: 'purchase' | 'refi' | 'cash_out_refi'
  loan_status: 'pending' | 'pre_approved' | 'approved' | 'funded' | 'denied' | 'withdrawn'
  
  // Property Information
  property_address?: string
  property_type?: string
  property_state?: string
  property_zip_code?: string
  property_city?: string
  property_county?: string
  property_occupancy?: string
  property_use?: string
  property_condition?: string
  property_year_built?: number
  property_square_footage?: number
  property_bedrooms?: number
  property_bathrooms?: number
  property_lot_size?: number
  property_zoning?: string
  
  // Financial Information
  estimated_home_value?: number
  purchase_price?: number
  loan_amount?: number
  down_payment_amount?: number
  down_payment_percentage?: number
  closing_costs?: number
  seller_concessions?: number
  repairs_improvements?: number
  reserves?: number
  
  // Income & Cash Flow (for DSCR loans)
  monthly_rental_income?: number
  annual_property_insurance?: number
  annual_property_taxes?: number
  monthly_hoa_fee?: number
  monthly_mortgage_payment?: number
  noi?: number
  dscr_ratio?: number
  cash_flow?: number
  
  // Loan Terms
  interest_rate?: number
  loan_term_years?: number
  prepayment_penalty?: string
  discount_points?: number
  
  // Borrower Information
  fico_score_range?: string
  
  // Broker Information
  broker_points?: number
  broker_admin_fee?: number
  broker_ysp?: number
  
  // Lender Information
  lender_name?: string
  loan_product?: string
  selected_loan_product?: any
  
  // Additional Costs
  flood_insurance?: number
  hazard_insurance?: number
  title_insurance?: number
  survey_fees?: number
  recording_fees?: number
  transfer_taxes?: number
  other_costs?: number
  
  // Flags
  is_short_term_rental?: boolean
  escrow_accounts?: boolean
  
  // Additional Data
  loan_data?: any
  notes?: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface LoanApplicationFormData {
  first_name: string
  last_name: string
  email: string
  phone_number: string
  ssn: string
  date_of_birth: string
  property_address: string
  property_is_tbd: boolean
  property_type: string
  current_residence: string
  loan_objective: LoanObjective
  loan_type: string
  total_income: number
  income_sources: IncomeSource[]
  income_documents: IncomeDocument[]
  total_assets: number
  bank_accounts: BankAccount[]
  bank_statements: (BankStatement | File)[]
  notes?: string
}

export interface LoanFormData {
  loan_name: string
  loan_type: string
  loan_objective: 'purchase' | 'refi' | 'cash_out_refi'
  property_address?: string
  property_type?: string
  property_state?: string
  property_zip_code?: string
  property_city?: string
  property_county?: string
  property_occupancy?: string
  property_use?: string
  property_condition?: string
  property_year_built?: number
  property_square_footage?: number
  property_bedrooms?: number
  property_bathrooms?: number
  property_lot_size?: number
  property_zoning?: string
  estimated_home_value?: number
  purchase_price?: number
  loan_amount?: number
  down_payment_amount?: number
  down_payment_percentage?: number
  closing_costs?: number
  seller_concessions?: number
  repairs_improvements?: number
  reserves?: number
  monthly_rental_income?: number
  annual_property_insurance?: number
  annual_property_taxes?: number
  monthly_hoa_fee?: number
  monthly_mortgage_payment?: number
  noi?: number
  dscr_ratio?: number
  cash_flow?: number
  interest_rate?: number
  loan_term_years?: number
  prepayment_penalty?: string
  discount_points?: number
  fico_score_range?: string
  broker_points?: number
  broker_admin_fee?: number
  broker_ysp?: number
  lender_name?: string
  loan_product?: string
  selected_loan_product?: any
  flood_insurance?: number
  hazard_insurance?: number
  title_insurance?: number
  survey_fees?: number
  recording_fees?: number
  transfer_taxes?: number
  other_costs?: number
  is_short_term_rental?: boolean
  escrow_accounts?: boolean
  loan_data?: any
  notes?: string
}

export interface DashboardStats {
  in_review: number
  approved: number
  ineligible: number
  denied: number
  closed: number
  missing_conditions: number
  pending_documents: number
  total: number
} 

// Condition Types
export type ConditionStatus = 'pending' | 'in_progress' | 'completed' | 'revision_requested'
export type ConditionType = 'credit_authorization' | 'bank_statements' | 'insurance' | 'application_fee'

export const CONDITION_STATUS_LABELS: Record<ConditionStatus, string> = {
  'pending': 'Pending',
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'revision_requested': 'Revision Requested'
}

export const CONDITION_STATUS_COLORS: Record<ConditionStatus, string> = {
  'pending': 'bg-gray-50 text-gray-700 border-gray-200',
  'in_progress': 'bg-blue-50 text-blue-800 border-blue-200',
  'completed': 'bg-green-50 text-green-800 border-green-200',
  'revision_requested': 'bg-yellow-50 text-yellow-800 border-yellow-200'
}

export interface ApplicationCondition {
  id: string
  application_id: string
  title: string
  description: string
  status: ConditionStatus
  condition_type: ConditionType
  fee_amount?: number
  due_date?: string
  created_at: string
  updated_at: string
}

export interface ConditionActivity {
  id: string
  condition_id: string
  activity_type: string
  message: string
  created_at: string
}

export interface ValidationErrors {
  [key: string]: string
}

// =====================================================
// NEW BORROWER & COMPANY TYPES
// =====================================================

export interface Borrower {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone_number?: string
  ssn?: string
  date_of_birth?: string
  current_residence?: string
  total_income: number
  income_sources: IncomeSource[]
  income_documents: IncomeDocument[]
  total_assets: number
  bank_accounts: BankAccount[]
  bank_statements: (BankStatement | File)[]
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  company_name: string
  company_type?: string // 'LLC', 'Corporation', 'Partnership', 'Sole Proprietorship'
  ein?: string // Employer Identification Number
  business_address?: string
  business_phone?: string
  business_email?: string
  industry?: string
  years_in_business?: number
  annual_revenue?: number
  number_of_employees?: number
  created_at: string
  updated_at: string
}

export interface BorrowerApplication {
  id: string
  borrower_id: string
  application_id: string
  borrower_role: 'primary' | 'co_borrower' | 'guarantor'
  created_at: string
}

export interface BorrowerCompany {
  id: string
  borrower_id: string
  company_id: string
  ownership_percentage?: number // 0-100
  role_in_company?: string // 'Owner', 'Partner', 'Manager', 'Employee'
  created_at: string
}

// =====================================================
// UPDATED APPLICATION FORM DATA (BORROWER-FOCUSED)
// =====================================================

export interface BorrowerFormData {
  // Personal Information
  first_name: string
  last_name: string
  email: string
  phone_number: string
  ssn: string
  date_of_birth: string
  current_residence: string
  
  // Income Information
  total_income: number
  income_sources: IncomeSource[]
  income_documents: IncomeDocument[]
  
  // Assets Information
  total_assets: number
  bank_accounts: BankAccount[]
  bank_statements: (BankStatement | File)[]
  
  // Company Information (optional)
  has_company: boolean
  company?: CompanyFormData
}

export interface CompanyFormData {
  company_name: string
  company_type?: string
  ein?: string
  business_address?: string
  business_phone?: string
  business_email?: string
  industry?: string
  years_in_business?: number
  annual_revenue?: number
  number_of_employees?: number
  ownership_percentage?: number
  role_in_company?: string
}

export interface ApplicationFormData {
  // Application-level information
  application_name: string
  application_type: 'loan_application' | 'refinance_application'
  notes?: string
  
  // Borrowers (can have multiple)
  borrowers: BorrowerFormData[]
  
  // Primary borrower is always first in the array
  primary_borrower: BorrowerFormData
}

// =====================================================
// UPDATED LOAN APPLICATION TYPE
// =====================================================



// =====================================================
// DEPRECATED - KEEPING FOR BACKWARD COMPATIBILITY
// =====================================================

 