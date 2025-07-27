-- =====================================================
-- VISTO CAPITAL PARTNER PORTAL - UNIFIED SCHEMA
-- =====================================================
-- This migration creates the complete database schema for the Visto Capital Partner Portal
-- Includes: Pricing matrices, partner profiles, loan applications, and DSCR calculator data

-- =====================================================
-- PRICING & ELIGIBILITY MATRICES
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS pricing_matrices CASCADE;
DROP TABLE IF EXISTS eligibility_matrices CASCADE;
DROP TABLE IF EXISTS lenders CASCADE;

-- Create lenders table first
CREATE TABLE lenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE lenders IS 'Stores information about lending institutions.';
COMMENT ON COLUMN lenders.name IS 'The name of the lending institution.';

-- Create eligibility matrices table
CREATE TABLE eligibility_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_id UUID NOT NULL REFERENCES lenders(id),
    effective_date DATE NOT NULL,
    rules JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eligibility_lender_id ON eligibility_matrices(lender_id);

COMMENT ON TABLE eligibility_matrices IS 'Stores loan eligibility rules, such as FICO score ranges, LTV limits, and state restrictions.';
COMMENT ON COLUMN eligibility_matrices.lender_id IS 'Foreign key referencing the lender.';
COMMENT ON COLUMN eligibility_matrices.effective_date IS 'The date from which this eligibility matrix is effective.';
COMMENT ON COLUMN eligibility_matrices.rules IS 'A JSONB object containing various eligibility criteria.';

-- Create pricing matrices table
CREATE TABLE pricing_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_id UUID NOT NULL REFERENCES lenders(id),
    eligibility_matrix_id UUID REFERENCES eligibility_matrices(id),
    effective_date DATE NOT NULL,
    pricing_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_lender_id ON pricing_matrices(lender_id);
CREATE INDEX idx_pricing_eligibility ON pricing_matrices(eligibility_matrix_id);

COMMENT ON TABLE pricing_matrices IS 'Stores loan pricing data, including rates and adjustments, from various lenders.';
COMMENT ON COLUMN pricing_matrices.lender_id IS 'Foreign key referencing the lender.';
COMMENT ON COLUMN pricing_matrices.eligibility_matrix_id IS 'Foreign key referencing the associated eligibility matrix.';
COMMENT ON COLUMN pricing_matrices.effective_date IS 'The date from which this pricing matrix is effective.';
COMMENT ON COLUMN pricing_matrices.pricing_data IS 'A JSONB object containing base rates, adjustments, and other pricing data.';

-- Enable RLS for pricing tables
ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_matrices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pricing tables
CREATE POLICY "Allow authenticated users to read lenders" ON lenders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read eligibility matrices" ON eligibility_matrices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read pricing matrices" ON pricing_matrices
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create service role policies for pricing tables
CREATE POLICY "Allow service role to manage lenders" ON lenders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage eligibility matrices" ON eligibility_matrices
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage pricing matrices" ON pricing_matrices
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- PARTNER PROFILES & USER MANAGEMENT
-- =====================================================

-- Create partner_profiles table (consolidated with user_profiles)
CREATE TABLE partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  partner_type TEXT CHECK (partner_type IN ('wholesaler', 'investor', 'real_estate_agent', 'marketing_partner')),
  phone_number TEXT,
  monthly_deal_volume INTEGER,
  transaction_volume NUMERIC,
  transaction_types TEXT[], -- e.g., ['Fix and Flip', 'Rental', 'Multifamily']
  license_number TEXT, -- only required for real estate agents
  license_state TEXT, -- only required for real estate agents
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT partner_profiles_user_id_unique UNIQUE (user_id)
);

-- Enable RLS for partner profiles
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;

-- Partner profiles policies
CREATE POLICY "Users can view their own partner profile" ON partner_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own partner profile" ON partner_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner profile" ON partner_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create partner_profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.partner_profiles (user_id, first_name, last_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create partner_profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- LOAN APPLICATIONS - COMPLETE SCHEMA
-- =====================================================

-- Create loan_applications table with all fields
CREATE TABLE loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  
  -- Personal Info (Required)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  ssn TEXT,
  date_of_birth DATE,
  
  -- Property Info
  property_address TEXT,
  property_is_tbd BOOLEAN DEFAULT FALSE,
  property_type TEXT,
  current_residence TEXT,
  
  -- Loan Information
  loan_objective TEXT CHECK (loan_objective IN ('refi', 'purchase')),
  loan_type TEXT,
  
  -- Income Information (for homeowner loans)
  total_income NUMERIC DEFAULT 0,
  income_sources JSONB DEFAULT '[]'::jsonb,
  income_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Assets Information
  total_assets NUMERIC DEFAULT 0,
  bank_accounts JSONB DEFAULT '[]'::jsonb,
  bank_statements JSONB DEFAULT '[]'::jsonb,
  
  -- DSCR Calculator Data - Core Fields
  dscr_data JSONB,
  estimated_home_value NUMERIC,
  loan_amount NUMERIC,
  down_payment_percentage NUMERIC,
  monthly_rental_income NUMERIC,
  annual_property_insurance NUMERIC,
  annual_property_taxes NUMERIC,
  monthly_hoa_fee NUMERIC,
  is_short_term_rental BOOLEAN DEFAULT FALSE,
  property_state TEXT,
  broker_points NUMERIC,
  broker_admin_fee NUMERIC,
  broker_ysp NUMERIC,
  selected_loan_product JSONB,
  dscr_results JSONB,
  
  -- DSCR Calculator Data - Additional Fields
  fico_score_range TEXT,
  prepayment_penalty TEXT,
  discount_points NUMERIC,
  transaction_type TEXT,
  property_zip_code TEXT,
  property_city TEXT,
  property_county TEXT,
  property_occupancy TEXT,
  property_use TEXT,
  property_condition TEXT,
  property_year_built INTEGER,
  property_square_footage NUMERIC,
  property_bedrooms INTEGER,
  property_bathrooms NUMERIC,
  property_lot_size NUMERIC,
  property_zoning TEXT,
  property_appraisal_value NUMERIC,
  property_purchase_price NUMERIC,
  property_seller_concessions NUMERIC,
  property_closing_costs NUMERIC,
  property_repairs_improvements NUMERIC,
  property_reserves NUMERIC,
  property_escrow_accounts BOOLEAN DEFAULT FALSE,
  property_flood_insurance NUMERIC,
  property_hazard_insurance NUMERIC,
  property_title_insurance NUMERIC,
  property_survey_fees NUMERIC,
  property_recording_fees NUMERIC,
  property_transfer_taxes NUMERIC,
  property_other_costs NUMERIC,
  
  -- Application status for dashboard categorization
  status TEXT NOT NULL DEFAULT 'in_review' CHECK (
    status IN ('in_review', 'approved', 'ineligible', 'denied', 'closed', 'missing_conditions', 'pending_documents')
  ),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for loan_applications
CREATE OR REPLACE FUNCTION update_loan_applications_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loan_applications_updated_at
  BEFORE UPDATE ON loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_applications_updated_at();

-- Enable RLS for loan applications
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Partners can only access their own applications
-- Helper function to get partner_id from user_id
CREATE OR REPLACE FUNCTION get_partner_id_from_user()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT id 
    FROM partner_profiles 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Select policy: Partners can only see their own applications
CREATE POLICY "Partners can view their own applications"
  ON loan_applications FOR SELECT
  USING (partner_id = get_partner_id_from_user());

-- Insert policy: Partners can only create applications for themselves
CREATE POLICY "Partners can create their own applications"
  ON loan_applications FOR INSERT
  WITH CHECK (partner_id = get_partner_id_from_user());

-- Update policy: Partners can only update their own applications
CREATE POLICY "Partners can update their own applications"
  ON loan_applications FOR UPDATE
  USING (partner_id = get_partner_id_from_user())
  WITH CHECK (partner_id = get_partner_id_from_user());

-- Delete policy: Partners can only delete their own applications
CREATE POLICY "Partners can delete their own applications"
  ON loan_applications FOR DELETE
  USING (partner_id = get_partner_id_from_user());

-- Create indexes for better performance
CREATE INDEX loan_applications_partner_id_idx ON loan_applications(partner_id);
CREATE INDEX loan_applications_status_idx ON loan_applications(status);
CREATE INDEX loan_applications_created_at_idx ON loan_applications(created_at DESC);
CREATE INDEX loan_applications_loan_objective_idx ON loan_applications(loan_objective);
CREATE INDEX loan_applications_loan_type_idx ON loan_applications(loan_type);
CREATE INDEX loan_applications_property_type_idx ON loan_applications(property_type);
CREATE INDEX loan_applications_total_income_idx ON loan_applications(total_income);

-- =====================================================
-- FILE STORAGE
-- =====================================================

-- Create the loan-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', true);

-- Allow authenticated users to upload files
CREATE POLICY "Partners can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'loan-documents' 
  AND auth.role() = 'authenticated'
);

-- Allow partners to view their own files
CREATE POLICY "Partners can view own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'loan-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text 
    FROM partner_profiles p 
    WHERE p.user_id = auth.uid()
  )
);

-- Allow partners to delete their own files
CREATE POLICY "Partners can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'loan-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text 
    FROM partner_profiles p 
    WHERE p.user_id = auth.uid()
  )
);

-- Allow partners to update their own files (if needed)
CREATE POLICY "Partners can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'loan-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text 
    FROM partner_profiles p 
    WHERE p.user_id = auth.uid()
  )
);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

-- DSCR Calculator Data Comments
COMMENT ON COLUMN loan_applications.dscr_data IS 'Complete DSCR calculator data as JSON';
COMMENT ON COLUMN loan_applications.estimated_home_value IS 'Estimated property value from DSCR calculator';
COMMENT ON COLUMN loan_applications.loan_amount IS 'Requested loan amount from DSCR calculator';
COMMENT ON COLUMN loan_applications.down_payment_percentage IS 'Down payment percentage from DSCR calculator';
COMMENT ON COLUMN loan_applications.monthly_rental_income IS 'Monthly rental income from DSCR calculator';
COMMENT ON COLUMN loan_applications.annual_property_insurance IS 'Annual property insurance from DSCR calculator';
COMMENT ON COLUMN loan_applications.annual_property_taxes IS 'Annual property taxes from DSCR calculator';
COMMENT ON COLUMN loan_applications.monthly_hoa_fee IS 'Monthly HOA fee from DSCR calculator';
COMMENT ON COLUMN loan_applications.is_short_term_rental IS 'Whether this is a short-term rental property';
COMMENT ON COLUMN loan_applications.property_state IS 'Property state from DSCR calculator';
COMMENT ON COLUMN loan_applications.broker_points IS 'Broker points from DSCR calculator';
COMMENT ON COLUMN loan_applications.broker_admin_fee IS 'Broker admin fee from DSCR calculator';
COMMENT ON COLUMN loan_applications.broker_ysp IS 'Broker YSP from DSCR calculator';
COMMENT ON COLUMN loan_applications.selected_loan_product IS 'Selected loan product details from DSCR calculator';
COMMENT ON COLUMN loan_applications.dscr_results IS 'DSCR calculation results including ratio, NOI, cash flow';

-- Additional DSCR Fields Comments
COMMENT ON COLUMN loan_applications.fico_score_range IS 'Estimated FICO score range from DSCR calculator';
COMMENT ON COLUMN loan_applications.prepayment_penalty IS 'Prepayment penalty terms from DSCR calculator';
COMMENT ON COLUMN loan_applications.discount_points IS 'Discount points from DSCR calculator';
COMMENT ON COLUMN loan_applications.transaction_type IS 'Transaction type (purchase/refinance) from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_zip_code IS 'Property ZIP code from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_city IS 'Property city from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_county IS 'Property county from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_occupancy IS 'Property occupancy type from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_use IS 'Property use type from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_condition IS 'Property condition from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_year_built IS 'Property year built from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_square_footage IS 'Property square footage from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_bedrooms IS 'Number of bedrooms from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_bathrooms IS 'Number of bathrooms from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_lot_size IS 'Lot size from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_zoning IS 'Property zoning from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_appraisal_value IS 'Property appraisal value from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_purchase_price IS 'Property purchase price from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_seller_concessions IS 'Seller concessions from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_closing_costs IS 'Closing costs from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_repairs_improvements IS 'Repairs and improvements from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_reserves IS 'Reserves from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_escrow_accounts IS 'Escrow accounts required from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_flood_insurance IS 'Flood insurance from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_hazard_insurance IS 'Hazard insurance from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_title_insurance IS 'Title insurance from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_survey_fees IS 'Survey fees from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_recording_fees IS 'Recording fees from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_transfer_taxes IS 'Transfer taxes from DSCR calculator';
COMMENT ON COLUMN loan_applications.property_other_costs IS 'Other costs from DSCR calculator';

-- =====================================================
-- LOANS (Multiple loans per application)
-- =====================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS loans CASCADE;

-- Create loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  
  -- Loan Basic Information
  loan_name TEXT NOT NULL, -- e.g., "Primary Residence", "Investment Property 1", "Fix & Flip"
  loan_type TEXT NOT NULL, -- e.g., "DSCR", "Conventional", "FHA", "VA", "Hard Money"
  loan_objective TEXT NOT NULL CHECK (loan_objective IN ('purchase', 'refi', 'cash_out_refi')),
  loan_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    loan_status IN ('pending', 'pre_approved', 'approved', 'funded', 'denied', 'withdrawn')
  ),
  
  -- Property Information
  property_address TEXT,
  property_type TEXT,
  property_state TEXT,
  property_zip_code TEXT,
  property_city TEXT,
  property_county TEXT,
  property_occupancy TEXT, -- "Primary", "Secondary", "Investment"
  property_use TEXT, -- "Rental", "Fix & Flip", "Owner Occupied"
  property_condition TEXT,
  property_year_built INTEGER,
  property_square_footage NUMERIC,
  property_bedrooms INTEGER,
  property_bathrooms NUMERIC,
  property_lot_size NUMERIC,
  property_zoning TEXT,
  
  -- Financial Information
  estimated_home_value NUMERIC,
  purchase_price NUMERIC,
  loan_amount NUMERIC,
  down_payment_amount NUMERIC,
  down_payment_percentage NUMERIC,
  closing_costs NUMERIC,
  seller_concessions NUMERIC,
  repairs_improvements NUMERIC,
  reserves NUMERIC,
  
  -- Income & Cash Flow (for DSCR loans)
  monthly_rental_income NUMERIC,
  annual_property_insurance NUMERIC,
  annual_property_taxes NUMERIC,
  monthly_hoa_fee NUMERIC,
  monthly_mortgage_payment NUMERIC,
  noi NUMERIC, -- Net Operating Income
  dscr_ratio NUMERIC, -- Debt Service Coverage Ratio
  cash_flow NUMERIC,
  
  -- Loan Terms
  interest_rate NUMERIC,
  loan_term_years INTEGER,
  prepayment_penalty TEXT,
  discount_points NUMERIC,
  
  -- Borrower Information
  fico_score_range TEXT,
  
  -- Broker Information
  broker_points NUMERIC,
  broker_admin_fee NUMERIC,
  broker_ysp NUMERIC,
  
  -- Lender Information
  lender_name TEXT,
  loan_product TEXT,
  selected_loan_product JSONB,
  
  -- Additional Costs
  flood_insurance NUMERIC,
  hazard_insurance NUMERIC,
  title_insurance NUMERIC,
  survey_fees NUMERIC,
  recording_fees NUMERIC,
  transfer_taxes NUMERIC,
  other_costs NUMERIC,
  
  -- Flags
  is_short_term_rental BOOLEAN DEFAULT FALSE,
  escrow_accounts BOOLEAN DEFAULT FALSE,
  
  -- Additional Data
  loan_data JSONB, -- Store any additional loan-specific data
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE loans IS 'Multiple loans can be associated with a single loan application';
COMMENT ON COLUMN loans.loan_name IS 'User-friendly name for the loan (e.g., "Primary Residence", "Investment Property 1")';
COMMENT ON COLUMN loans.loan_type IS 'Type of loan (DSCR, Conventional, FHA, VA, Hard Money, etc.)';
COMMENT ON COLUMN loans.loan_objective IS 'Purpose of the loan (purchase, refi, cash_out_refi)';
COMMENT ON COLUMN loans.loan_status IS 'Current status of this specific loan';
COMMENT ON COLUMN loans.property_occupancy IS 'How the property will be occupied (Primary, Secondary, Investment)';
COMMENT ON COLUMN loans.property_use IS 'How the property will be used (Rental, Fix & Flip, Owner Occupied)';
COMMENT ON COLUMN loans.dscr_ratio IS 'Debt Service Coverage Ratio for DSCR loans';
COMMENT ON COLUMN loans.noi IS 'Net Operating Income for DSCR loans';
COMMENT ON COLUMN loans.cash_flow IS 'Monthly cash flow after all expenses';

-- Create indexes for performance
CREATE INDEX idx_loans_application_id ON loans(application_id);
CREATE INDEX idx_loans_status ON loans(loan_status);
CREATE INDEX idx_loans_type ON loans(loan_type);
CREATE INDEX idx_loans_created_at ON loans(created_at);

-- Create RLS policies for loans table
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can only see their own loans
CREATE POLICY "Partners can view their own loans" ON loans
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM loan_applications 
      WHERE partner_id IN (
        SELECT id FROM partner_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Partners can insert their own loans
CREATE POLICY "Partners can insert their own loans" ON loans
  FOR INSERT WITH CHECK (
    application_id IN (
      SELECT id FROM loan_applications 
      WHERE partner_id IN (
        SELECT id FROM partner_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Partners can update their own loans
CREATE POLICY "Partners can update their own loans" ON loans
  FOR UPDATE USING (
    application_id IN (
      SELECT id FROM loan_applications 
      WHERE partner_id IN (
        SELECT id FROM partner_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Partners can delete their own loans
CREATE POLICY "Partners can delete their own loans" ON loans
  FOR DELETE USING (
    application_id IN (
      SELECT id FROM loan_applications 
      WHERE partner_id IN (
        SELECT id FROM partner_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_loans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_loans_updated_at();

-- =====================================================
-- SCHEMA COMPLETE
-- ===================================================== 