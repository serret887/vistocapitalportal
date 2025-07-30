-- =====================================================
-- VISTO CAPITAL PARTNER PORTAL - UNIFIED SCHEMA (USER-BASED SECURITY)
-- =====================================================
-- This migration creates the complete database schema for the Visto Capital Partner Portal
-- All tables use user_id for security and RLS is enforced everywhere

-- ========== LENDERS, PRICING, ELIGIBILITY ==========
CREATE TABLE lenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE eligibility_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES lenders(id),
  effective_date DATE NOT NULL,
  rules JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE pricing_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES lenders(id),
  eligibility_matrix_id UUID REFERENCES eligibility_matrices(id),
  effective_date DATE NOT NULL,
  pricing_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_matrices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read lenders" ON lenders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read eligibility matrices" ON eligibility_matrices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to read pricing matrices" ON pricing_matrices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service role to manage lenders" ON lenders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage eligibility matrices" ON eligibility_matrices FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role to manage pricing matrices" ON pricing_matrices FOR ALL USING (auth.role() = 'service_role');

-- ========== USER & PARTNER PROFILES ==========
CREATE TABLE partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  partner_type TEXT CHECK (partner_type IN ('wholesaler', 'investor', 'real_estate_agent', 'marketing_partner')),
  onboarded BOOLEAN DEFAULT FALSE,
  phone_number TEXT,
  transaction_types JSONB DEFAULT '[]'::jsonb,
  monthly_deal_volume INTEGER,
  transaction_volume NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own partner profile" ON partner_profiles FOR ALL USING (user_id = auth.uid());

-- ========== CLIENTS ==========
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  ssn TEXT,
  date_of_birth DATE,
  current_residence TEXT,
  total_income NUMERIC DEFAULT 0,
  income_sources JSONB DEFAULT '[]'::jsonb,
  income_documents JSONB DEFAULT '[]'::jsonb,
  total_assets NUMERIC DEFAULT 0,
  bank_accounts JSONB DEFAULT '[]'::jsonb,
  bank_statements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own clients" ON clients FOR ALL USING (user_id = auth.uid());

-- ========== COMPANIES ==========
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_type TEXT,
  ein TEXT,
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  industry TEXT,
  years_in_business INTEGER,
  annual_revenue NUMERIC,
  number_of_employees INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own companies" ON companies FOR ALL USING (user_id = auth.uid());

-- ========== CLIENT-COMPANY RELATIONSHIPS ==========
CREATE TABLE client_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  ownership_percentage NUMERIC CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),
  role_in_company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, company_id)
);
ALTER TABLE client_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own client_companies" ON client_companies FOR ALL USING (
  EXISTS (SELECT 1 FROM clients c WHERE c.id = client_companies.client_id AND c.user_id = auth.uid())
);

-- ========== APPLICATIONS ==========
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_name TEXT,
  application_type TEXT DEFAULT 'loan_application',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_review' CHECK (
    status IN ('in_review', 'approved', 'ineligible', 'denied', 'closed', 'missing_conditions', 'pending_documents')
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own applications" ON applications FOR ALL USING (user_id = auth.uid());

-- ========== CLIENT-APPLICATION RELATIONSHIPS ==========
CREATE TABLE client_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, application_id)
);
ALTER TABLE client_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own client_applications" ON client_applications FOR ALL USING (
  EXISTS (SELECT 1 FROM applications a WHERE a.id = client_applications.application_id AND a.user_id = auth.uid())
);

-- ========== LOANS ==========
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  loan_name TEXT NOT NULL,
  loan_type TEXT NOT NULL,
  loan_objective TEXT NOT NULL CHECK (loan_objective IN ('purchase', 'refi', 'cash_out_refi')),
  loan_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    loan_status IN ('pending', 'pre_approved', 'approved', 'funded', 'denied', 'withdrawn')
  ),
  property_address TEXT,
  property_type TEXT,
  property_state TEXT,
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
  estimated_home_value NUMERIC,
  purchase_price NUMERIC,
  loan_amount NUMERIC,
  down_payment_amount NUMERIC,
  down_payment_percentage NUMERIC,
  closing_costs NUMERIC,
  seller_concessions NUMERIC,
  repairs_improvements NUMERIC,
  reserves NUMERIC,
  monthly_rental_income NUMERIC,
  annual_property_insurance NUMERIC,
  annual_property_taxes NUMERIC,
  monthly_hoa_fee NUMERIC,
  monthly_mortgage_payment NUMERIC,
  noi NUMERIC,
  dscr_ratio NUMERIC,
  cash_flow NUMERIC,
  interest_rate NUMERIC,
  loan_term_years INTEGER,
  prepayment_penalty TEXT,
  discount_points NUMERIC,
  fico_score_range TEXT,
  broker_points NUMERIC,
  broker_admin_fee NUMERIC,
  broker_ysp NUMERIC,
  lender_name TEXT,
  loan_product TEXT,
  selected_loan_product JSONB,
  flood_insurance NUMERIC,
  hazard_insurance NUMERIC,
  title_insurance NUMERIC,
  survey_fees NUMERIC,
  recording_fees NUMERIC,
  transfer_taxes NUMERIC,
  other_costs NUMERIC,
  is_short_term_rental BOOLEAN DEFAULT FALSE,
  escrow_accounts BOOLEAN DEFAULT FALSE,
  loan_data JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own loans" ON loans FOR ALL USING (user_id = auth.uid());

-- ========== CONDITIONS SYSTEM ==========
CREATE TABLE application_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'revision_requested')),
  condition_type TEXT NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE condition_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_id UUID NOT NULL REFERENCES application_conditions(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE application_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE condition_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own application_conditions" ON application_conditions FOR ALL USING (
  EXISTS (SELECT 1 FROM applications la WHERE la.id = application_conditions.application_id AND la.user_id = auth.uid())
);
CREATE POLICY "Users can manage their own condition_activities" ON condition_activities FOR ALL USING (
  EXISTS (SELECT 1 FROM application_conditions ac JOIN applications la ON ac.application_id = la.id WHERE ac.id = condition_activities.condition_id AND la.user_id = auth.uid())
);

-- ========== TRIGGERS & VALIDATION ==========
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_application_conditions_updated_at BEFORE UPDATE ON application_conditions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ownership validation for client_companies
CREATE OR REPLACE FUNCTION validate_company_ownership() RETURNS TRIGGER AS $$
DECLARE total_ownership NUMERIC;
BEGIN
  SELECT COALESCE(SUM(ownership_percentage), 0) INTO total_ownership FROM client_companies WHERE company_id = NEW.company_id;
  IF total_ownership > 100 THEN
    RAISE EXCEPTION 'Total ownership percentage for company % cannot exceed 100%%. Current total: %', NEW.company_id, total_ownership;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER validate_company_ownership_insert BEFORE INSERT ON client_companies FOR EACH ROW EXECUTE FUNCTION validate_company_ownership();
CREATE TRIGGER validate_company_ownership_update BEFORE UPDATE ON client_companies FOR EACH ROW EXECUTE FUNCTION validate_company_ownership();

-- ========== COMMENTS ==========
COMMENT ON TABLE clients IS 'Stores client personal information, income, and assets. Each client belongs to a user.';
COMMENT ON TABLE companies IS 'Stores company information. Each company belongs to a user.';
COMMENT ON TABLE applications IS 'Stores application-level information and links clients to loans. Each application belongs to a user.';
COMMENT ON TABLE loans IS 'Stores loan-specific information including property details, financial terms, and DSCR data. Each loan belongs to a user.';
COMMENT ON TABLE client_applications IS 'Links clients to applications.';
COMMENT ON TABLE client_companies IS 'Links clients to companies with ownership percentage and role.';
COMMENT ON TABLE application_conditions IS 'Stores conditions that must be met for loan approval.';
COMMENT ON TABLE condition_activities IS 'Stores activity log for condition status changes and updates.';
COMMENT ON FUNCTION validate_company_ownership() IS 'Validates that total ownership percentage for a company never exceeds 100%.'; 