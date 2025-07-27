-- =====================================================
-- VISTO CAPITAL PARTNER PORTAL - PRODUCTION SETUP
-- =====================================================
-- Run this in your Supabase SQL Editor to set up the complete database

-- =====================================================
-- PRICING & ELIGIBILITY MATRICES
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS pricing_matrices CASCADE;
DROP TABLE IF EXISTS eligibility_matrices CASCADE;
DROP TABLE IF EXISTS lenders CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS loan_applications CASCADE;
DROP TABLE IF EXISTS partner_profiles CASCADE;

-- Create lenders table first
CREATE TABLE lenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create eligibility matrices table
CREATE TABLE eligibility_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_id UUID NOT NULL REFERENCES lenders(id),
    effective_date DATE NOT NULL,
    rules JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eligibility_lender_id ON eligibility_matrices(lender_id);

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

-- Create partner_profiles table
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
  transaction_types TEXT[] DEFAULT '{}',
  license_number TEXT,
  license_state TEXT,
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT partner_profiles_user_id_unique UNIQUE (user_id)
);

-- Enable RLS for partner_profiles
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for partner_profiles
CREATE POLICY "Users can view their own partner profile" ON partner_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own partner profile" ON partner_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner profile" ON partner_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.partner_profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- LOAN APPLICATIONS
-- =====================================================

-- Create loan_applications table
CREATE TABLE loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  ssn TEXT,
  date_of_birth DATE,
  property_address TEXT,
  property_is_tbd BOOLEAN DEFAULT FALSE,
  property_type TEXT,
  current_residence TEXT,
  loan_objective TEXT CHECK (loan_objective IN ('purchase', 'refinance', 'cash_out', 'rate_term')),
  loan_type TEXT,
  total_income NUMERIC,
  income_sources TEXT[],
  total_assets NUMERIC,
  bank_accounts JSONB,
  bank_statements JSONB,
  status TEXT DEFAULT 'in_review' CHECK (status IN ('in_review', 'approved', 'ineligible', 'denied', 'closed', 'missing_conditions', 'pending_documents')),
  dscr_data JSONB,
  estimated_home_value NUMERIC,
  loan_amount NUMERIC,
  down_payment_percentage NUMERIC,
  monthly_rental_income NUMERIC,
  annual_property_insurance NUMERIC,
  annual_property_taxes NUMERIC,
  monthly_hoa_fee NUMERIC,
  is_short_term_rental BOOLEAN,
  property_state TEXT,
  broker_points NUMERIC,
  broker_admin_fee NUMERIC,
  broker_ysp NUMERIC,
  selected_loan_product JSONB,
  dscr_results JSONB,
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
  property_square_footage INTEGER,
  property_bedrooms INTEGER,
  property_bathrooms INTEGER,
  property_lot_size NUMERIC,
  property_zoning TEXT,
  property_appraisal_value NUMERIC,
  property_purchase_price NUMERIC,
  property_seller_concessions NUMERIC,
  property_closing_costs NUMERIC,
  property_repairs_improvements NUMERIC,
  property_reserves NUMERIC,
  property_escrow_accounts JSONB,
  property_flood_insurance NUMERIC,
  property_hazard_insurance NUMERIC,
  property_title_insurance NUMERIC,
  property_survey_fees NUMERIC,
  property_recording_fees NUMERIC,
  property_transfer_taxes NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for loan_applications
CREATE INDEX idx_loan_applications_partner_id ON loan_applications(partner_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_loan_applications_created_at ON loan_applications(created_at);

-- Enable RLS for loan_applications
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loan_applications
CREATE POLICY "Partners can view their own applications" ON loan_applications
    FOR SELECT USING (
        partner_id IN (
            SELECT id FROM partner_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can insert their own applications" ON loan_applications
    FOR INSERT WITH CHECK (
        partner_id IN (
            SELECT id FROM partner_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can update their own applications" ON loan_applications
    FOR UPDATE USING (
        partner_id IN (
            SELECT id FROM partner_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can delete their own applications" ON loan_applications
    FOR DELETE USING (
        partner_id IN (
            SELECT id FROM partner_profiles WHERE user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_loan_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamp
CREATE TRIGGER update_loan_applications_updated_at
  BEFORE UPDATE ON loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_applications_updated_at();

-- =====================================================
-- LOANS
-- =====================================================

-- Create loans table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  loan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for loans
CREATE INDEX idx_loans_application_id ON loans(application_id);
CREATE INDEX idx_loans_created_at ON loans(created_at);

-- Enable RLS for loans
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loans
CREATE POLICY "Partners can view their own loans" ON loans
    FOR SELECT USING (
        application_id IN (
            SELECT la.id FROM loan_applications la
            JOIN partner_profiles pp ON la.partner_id = pp.id
            WHERE pp.user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can insert their own loans" ON loans
    FOR INSERT WITH CHECK (
        application_id IN (
            SELECT la.id FROM loan_applications la
            JOIN partner_profiles pp ON la.partner_id = pp.id
            WHERE pp.user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can update their own loans" ON loans
    FOR UPDATE USING (
        application_id IN (
            SELECT la.id FROM loan_applications la
            JOIN partner_profiles pp ON la.partner_id = pp.id
            WHERE pp.user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can delete their own loans" ON loans
    FOR DELETE USING (
        application_id IN (
            SELECT la.id FROM loan_applications la
            JOIN partner_profiles pp ON la.partner_id = pp.id
            WHERE pp.user_id = auth.uid()
        )
    );

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert lender
INSERT INTO lenders (id, name) 
VALUES ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Visio')
RETURNING id;

-- Insert eligibility matrix with comprehensive business rules
INSERT INTO eligibility_matrices (lender_id, effective_date, rules) 
VALUES (
  'd290f1ee-6c54-4b01-90e6-d701748f0851',
  CURRENT_DATE,
  '{
    "fico_score_ranges": [
      {"min": 740, "max": 759, "label": "740-759"},
      {"min": 760, "max": 779, "label": "760-779"},
      {"min": 780, "max": 850, "label": "780+"}
    ],
    "ltv_limits": {
      "max_ltv": 80,
      "min_ltv": 20
    },
    "dscr_requirements": {
      "min_dscr": 1.25,
      "max_dscr": 2.5
    },
    "property_types": ["single_family", "condo", "townhouse", "multi_family"],
    "occupancy_types": ["investment", "second_home", "primary_residence"],
    "loan_purposes": ["purchase", "refinance"],
    "state_restrictions": [],
    "max_loan_amount": 2000000,
    "min_loan_amount": 100000
  }'
);

-- Insert pricing matrix
INSERT INTO pricing_matrices (lender_id, effective_date, pricing_data) 
VALUES (
  'd290f1ee-6c54-4b01-90e6-d701748f0851',
  CURRENT_DATE,
  '{
    "base_rates": {
      "30_year_fixed": {
        "740-759": 7.25,
        "760-779": 7.125,
        "780+": 7.0
      },
      "30_year_fixed_io": {
        "740-759": 7.5,
        "760-779": 7.375,
        "780+": 7.25
      },
      "7_1_arm": {
        "740-759": 6.875,
        "760-779": 6.75,
        "780+": 6.625
      },
      "7_1_arm_io": {
        "740-759": 7.125,
        "760-779": 7.0,
        "780+": 6.875
      },
      "5_1_arm": {
        "740-759": 6.625,
        "760-779": 6.5,
        "780+": 6.375
      },
      "5_1_arm_io": {
        "740-759": 6.875,
        "760-779": 6.75,
        "780+": 6.625
      }
    },
    "adjustments": {
      "ltv_adjustments": [
        {"min_ltv": 0, "max_ltv": 60, "adjustment": 0},
        {"min_ltv": 60.01, "max_ltv": 70, "adjustment": 0.125},
        {"min_ltv": 70.01, "max_ltv": 80, "adjustment": 0.25}
      ],
      "dscr_adjustments": [
        {"min_dscr": 1.25, "max_dscr": 1.35, "adjustment": 0.5},
        {"min_dscr": 1.35, "max_dscr": 1.5, "adjustment": 0.25},
        {"min_dscr": 1.5, "max_dscr": 2.5, "adjustment": 0}
      ],
      "property_type_adjustments": {
        "single_family": 0,
        "condo": 0.125,
        "townhouse": 0.0625,
        "multi_family": 0.25
      },
      "occupancy_adjustments": {
        "investment": 0,
        "second_home": 0.125,
        "primary_residence": 0.25
      },
      "loan_purpose_adjustments": {
        "purchase": 0,
        "refinance": 0.125
      },
      "short_term_rental_adjustment": 0.375,
      "broker_comp_adjustment": 0.125,
      "prepay_adjustments": {
        "5/5/5/5/5": 0,
        "3/2/1/0/0": 0.125,
        "1/0/0/0/0": 0.25,
        "no_penalty": 0.5
      }
    },
    "fees": {
      "origination_fee": 1.0,
      "processing_fee": 995,
      "underwriting_fee": 995,
      "appraisal_fee": 550,
      "credit_report_fee": 50,
      "flood_cert_fee": 15,
      "tax_service_fee": 75,
      "title_insurance_fee": 0.5,
      "recording_fee": 150,
      "transfer_tax_fee": 0.5
    }
  }'
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that all tables were created
SELECT 'Tables created successfully' as status;

-- Show all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 