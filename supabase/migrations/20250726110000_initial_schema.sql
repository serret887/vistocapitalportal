-- Create pricing_matrices table for dynamic loan pricing
CREATE TABLE IF NOT EXISTS pricing_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id TEXT NOT NULL,
  loan_program TEXT NOT NULL,
  matrix JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_matrices_lender_program
ON pricing_matrices(lender_id, loan_program);

CREATE INDEX IF NOT EXISTS idx_pricing_matrices_created_at
ON pricing_matrices(created_at);

-- Create unique constraint to prevent duplicate matrices for same lender/program
CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_matrices_unique
ON pricing_matrices(lender_id, loan_program);

-- Add RLS policies
ALTER TABLE pricing_matrices ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read pricing matrices
CREATE POLICY "Allow authenticated users to read pricing matrices" ON pricing_matrices
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to manage pricing matrices
CREATE POLICY "Allow service role to manage pricing matrices" ON pricing_matrices
  FOR ALL USING (auth.role() = 'service_role');

-- Insert Visio pricing matrix for DSCR loans
INSERT INTO pricing_matrices (lender_id, loan_program, matrix) VALUES (
  'visio',
  'DSCR',
  '{
    "lender": "Rental360",
    "date": "2025-07-14",
    "meta": {
      "loan_originators": ["Visio Financial Services Inc.", "Investor Mortgage Finance LLC"],
      "not_available_in_states": ["AK", "MN", "NE", "NV", "ND", "OR", "SD", "UT", "VT"],
      "nmls_ids": {
        "VFS": "1935590",
        "IMF": "2297"
      }
    },
    "loan_terms": {
      "term": "30 Years",
      "amortization": "Fully Amortizing (No Balloons)",
      "max_ltv": 80,
      "underwriting_fee": 1645,
      "small_loan_fee": {
        "amount": 1500,
        "range": {
          "min": 75000,
          "max": 124999
        }
      }
    },
    "borrower_requirements": {
      "borrower_types": ["Investor Only"],
      "entity_types": ["Individuals", "LLCs", "Corporations", "Limited Partnerships"],
      "citizenship": ["US Citizens", "Permanent Resident Aliens"],
      "min_assets_reserves_months": 6,
      "credit": {
        "middle_score_used": true,
        "min_active_tradelines": true,
        "dil_seasoning_years": 3,
        "late_payment_limitations": true
      }
    },
    "property_requirements": {
      "property_types": ["1-4 Unit SFR", "Townhomes", "Condos"],
      "min_value": 125000,
      "condition": ["C1", "C2", "C3", "C4"],
      "dscr_min": 1.00,
      "lease_status": ["Leased", "Unleased (must be rent ready)"]
    },
    "rate_structure": {
      "products": {
        "5_6_ARM": 0.000,
        "7_6_ARM": 0.100,
        "30_Year_Fixed": 0.200,
        "Interest_Only": 0.250
      },
      "origination_fee_adjustments": {
        "0%": 0.000,
        "0.5%": -0.150,
        "1%": -0.300,
        "1.5%": -0.450,
        "2%": -0.600,
        "2.5%": -0.700,
        "3%": -0.800
      },
      "loan_size_adjustments": {
        ">=2000000": 0.750,
        "1500000-1999999": 0.250,
        "250000-1499999": 0.000,
        "125000-249999": 0.250,
        "100000-124999": 0.500,
        "75000-99999": 1.250
      },
      "prepay_penalty_structures": {
        "5/5/5/5/5": -0.250,
        "3/3/3": -0.175,
        "5/4/3/2/1": 0.000,
        "3/2/1": 0.250,
        "3/0/0": 0.500,
        "0/0/0": 1.000,
        "notes": {
          "zero_prepay_required_in": ["NM", "KS", "OH", "MD", "RI (Purchase)", "PA < $319,777"],
          "3/3/3_restrictions": "Only on 5/6 ARM, 720+ FICO, No IO, DSCR ≥ 1. Min rate 6.25%."
        },
        "not_eligible_in": ["MS"]
      },
      "program_adjustments": {
        "cash_out_refinance": 0.375,
        "short_term_rental": 0.250,
        "condo": 0.200,
        "2_4_units": 0.250,
        "dscr_adjustments": {
          "dscr_gt_1_20": -0.125,
          "dscr_lt_1_00_to_0_75_ltv_le_65": 0.500,
          "dscr_lt_1_00": "case-by-case"
        }
      },
      "minimum_rate": 6.625
    },
    "base_rates": {
      "tiers": {
        "760+": {
          "<55": 5.900,
          "55.01-60": 5.975,
          "60.01-65": 6.100,
          "65.01-70": 6.250,
          "70.01-75": 6.450,
          "75.01-80": 6.700
        },
        "740-759": {
          "<55": 6.025,
          "55.01-60": 6.100,
          "60.01-65": 6.225,
          "65.01-70": 6.375,
          "70.01-75": 6.575,
          "75.01-80": 6.825
        },
        "720-739": {
          "<55": 6.250,
          "55.01-60": 6.325,
          "60.01-65": 6.450,
          "65.01-70": 6.600,
          "70.01-75": 6.800,
          "75.01-80": 7.050
        },
        "700-719": {
          "<55": 6.550,
          "55.01-60": 6.625,
          "60.01-65": 6.650,
          "65.01-70": 6.800,
          "70.01-75": 7.000,
          "75.01-80": 7.650
        },
        "680-699": {
          "60.01-65": 7.125,
          "65.01-70": 7.125,
          "70.01-75": 7.125,
          "75.01-80": 7.625
        }
      },
      "notes": {
        "refinance_min_fico": 720,
        "dscr_gt_1.20_not_available_on_io": true
      }
    },
    "broker_payout_add_ons": {
      "0.25": 0.062,
      "0.5": 0.125,
      "0.75": 0.187,
      "1": 0.25,
      "1.25": 0.312,
      "1.5": 0.375,
      "1.75": 0.437,
      "2": 0.5
    }
  }'::jsonb
) ON CONFLICT (lender_id, loan_program) DO NOTHING; -- Visto Capital Partner Portal Database Schema

-- Create user_profiles table for basic user information
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create partner_profiles table for onboarding information
create table partner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_type text check (partner_type in ('wholesaler', 'investor', 'real_estate_agent', 'marketing_partner')),
  phone_number text,
  monthly_deal_volume integer,
  transaction_volume numeric,
  transaction_types text[], -- e.g., ['Fix and Flip', 'Rental', 'Multifamily']
  license_number text, -- only required for real estate agents
  license_state text, -- only required for real estate agents
  onboarded boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS (Row Level Security) policies
alter table user_profiles enable row level security;
alter table partner_profiles enable row level security;

-- User profiles policies
create policy "Users can view own profile" on user_profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on user_profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on user_profiles
  for insert with check (auth.uid() = id);

-- Partner profiles policies
create policy "Users can view their own partner profile" on partner_profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert their own partner profile" on partner_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own partner profile" on partner_profiles
  for update using (auth.uid() = user_id);

-- Function to automatically create user_profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create user_profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- Create loan_applications table for Phase 2 client dashboard
create table loan_applications (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partner_profiles(id) on delete cascade,
  
  -- Personal Info (Required)
  first_name text not null,
  last_name text not null,
  email text,
  ssn text,
  date_of_birth date,
  
  -- Housing Info
  property_address text,
  current_residence text,
  
  -- Application status for dashboard categorization
  status text not null default 'in_review' check (
    status in ('in_review', 'approved', 'ineligible', 'denied', 'closed', 'missing_conditions')
  ),
  
  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create updated_at trigger
create or replace function update_loan_applications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_loan_applications_updated_at
  before update on loan_applications
  for each row
  execute function update_loan_applications_updated_at();

-- Enable RLS
alter table loan_applications enable row level security;

-- RLS Policies: Partners can only access their own applications
-- First, we need to create a helper function to get partner_id from user_id
create or replace function get_partner_id_from_user()
returns uuid as $$
begin
  return (
    select id 
    from partner_profiles 
    where user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Select policy: Partners can only see their own applications
create policy "Partners can view their own applications"
  on loan_applications for select
  using (partner_id = get_partner_id_from_user());

-- Insert policy: Partners can only create applications for themselves
create policy "Partners can create their own applications"
  on loan_applications for insert
  with check (partner_id = get_partner_id_from_user());

-- Update policy: Partners can only update their own applications
create policy "Partners can update their own applications"
  on loan_applications for update
  using (partner_id = get_partner_id_from_user())
  with check (partner_id = get_partner_id_from_user());

-- Delete policy: Partners can only delete their own applications
create policy "Partners can delete their own applications"
  on loan_applications for delete
  using (partner_id = get_partner_id_from_user());

-- Create indexes for better performance
create index loan_applications_partner_id_idx on loan_applications(partner_id);
create index loan_applications_status_idx on loan_applications(status);
create index loan_applications_created_at_idx on loan_applications(created_at desc);
-- Add enhanced fields to loan_applications table
alter table loan_applications add column if not exists phone_number text;

-- Property information enhancements
alter table loan_applications add column if not exists property_is_tbd boolean default false;
alter table loan_applications add column if not exists property_type text;

-- Loan information
alter table loan_applications add column if not exists loan_objective text check (
  loan_objective in ('refi', 'purchase')
);
alter table loan_applications add column if not exists loan_type text;

-- Enhanced loan types (similar to transaction types from onboarding)
alter table loan_applications add column if not exists loan_property_types text[] default '{}';

-- Assets information
alter table loan_applications add column if not exists total_assets numeric default 0;
alter table loan_applications add column if not exists bank_accounts jsonb default '[]'::jsonb;

-- File uploads for bank statements (we'll store file paths/URLs)
alter table loan_applications add column if not exists bank_statements jsonb default '[]'::jsonb;

-- Add more structured asset tracking
-- bank_accounts will store: [{"bank_name": "Bank of America", "account_type": "Checking", "balance": 5000, "statement_months": 2}]
-- bank_statements will store: [{"account_id": "uuid", "month": "2024-01", "file_url": "path/to/file"}]

-- Update the status check constraint to ensure we have the correct statuses
alter table loan_applications drop constraint if exists loan_applications_status_check;
alter table loan_applications add constraint loan_applications_status_check check (
  status in ('in_review', 'approved', 'ineligible', 'denied', 'closed', 'missing_conditions', 'pending_documents')
);

-- Add index for new searchable fields
create index if not exists loan_applications_loan_objective_idx on loan_applications(loan_objective);
create index if not exists loan_applications_loan_type_idx on loan_applications(loan_type);
create index if not exists loan_applications_property_type_idx on loan_applications(property_type);
-- Remove the loan_property_types column since we simplified the loan selection
-- Now we only use loan_objective (refi/purchase) and loan_type (specific type based on objective)
alter table loan_applications drop column if exists loan_property_types;
-- Add income documentation support for home owner loans
-- This will only be required when loan_type = 'homeowner'

-- Income information
alter table loan_applications add column if not exists total_income numeric default 0;
alter table loan_applications add column if not exists income_sources jsonb default '[]'::jsonb;

-- Income document uploads
alter table loan_applications add column if not exists income_documents jsonb default '[]'::jsonb;

-- Structure for income_sources:
-- [
--   {
--     "id": "uuid",
--     "type": "w2" | "alimony" | "ssn" | "1099",
--     "amount": 50000,
--     "description": "Primary Employment"
--   }
-- ]

-- Structure for income_documents:
-- [
--   {
--     "id": "uuid",
--     "document_type": "w2" | "alimony" | "ssn" | "1099" | "1040_tax_return",
--     "file_name": "w2_2023.pdf",
--     "file_size": 1024000,
--     "file_url": "path/to/file",
--     "income_source_id": "uuid", -- links to income_sources (null for 1040)
--     "uploaded_at": "2025-01-01T00:00:00Z"
--   }
-- ]

-- Add indexes for better performance
create index if not exists loan_applications_total_income_idx on loan_applications(total_income);
create index if not exists loan_applications_loan_type_idx on loan_applications(loan_type) where loan_type = 'homeowner';
-- Create the loan-documents storage bucket
insert into storage.buckets (id, name, public)
values ('loan-documents', 'loan-documents', true);

-- Allow authenticated users to upload files
create policy "Partners can upload files" on storage.objects
for insert with check (
  bucket_id = 'loan-documents' 
  and auth.role() = 'authenticated'
);

-- Allow partners to view their own files
create policy "Partners can view own files" on storage.objects
for select using (
  bucket_id = 'loan-documents' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] in (
    select p.id::text 
    from partner_profiles p 
    where p.user_id = auth.uid()
  )
);

-- Allow partners to delete their own files
create policy "Partners can delete own files" on storage.objects
for delete using (
  bucket_id = 'loan-documents' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] in (
    select p.id::text 
    from partner_profiles p 
    where p.user_id = auth.uid()
  )
);

-- Allow partners to update their own files (if needed)
create policy "Partners can update own files" on storage.objects
for update using (
  bucket_id = 'loan-documents' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] in (
    select p.id::text 
    from partner_profiles p 
    where p.user_id = auth.uid()
  )
); -- Consolidate user_profiles and partner_profiles into a single partner_profiles table
-- This eliminates redundancy since every user in the system is a partner

-- First, add the user profile fields to partner_profiles
ALTER TABLE partner_profiles 
ADD COLUMN first_name text,
ADD COLUMN last_name text,
ADD COLUMN email text;

-- Update partner_profiles with data from user_profiles
UPDATE partner_profiles 
SET 
  first_name = up.first_name,
  last_name = up.last_name,
  email = up.email
FROM user_profiles up
WHERE partner_profiles.user_id = up.id;

-- Make the new fields NOT NULL after populating them
ALTER TABLE partner_profiles 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL,
ALTER COLUMN email SET NOT NULL;

-- Drop the user_profiles table since it's now redundant
DROP TABLE user_profiles;

-- Update the trigger function to create partner_profiles instead of user_profiles
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

-- The trigger will continue to work with the updated function
-- No need to recreate the trigger since it references the function by name

-- Update RLS policies to work with the consolidated table
-- Drop old policies (use IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Users can view own profile" ON partner_profiles;
DROP POLICY IF EXISTS "Users can insert their own partner profile" ON partner_profiles;
DROP POLICY IF EXISTS "Users can update their own partner profile" ON partner_profiles;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own partner profile" ON partner_profiles;
DROP POLICY IF EXISTS "Users can insert their own partner profile" ON partner_profiles;
DROP POLICY IF EXISTS "Users can update their own partner profile" ON partner_profiles;

-- Create new consolidated policies
CREATE POLICY "Users can view their own partner profile" ON partner_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own partner profile" ON partner_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner profile" ON partner_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Add a unique constraint on user_id to ensure one profile per user
ALTER TABLE partner_profiles 
ADD CONSTRAINT partner_profiles_user_id_unique UNIQUE (user_id); -- Fix variable names in pricing matrix by replacing dots with underscores
-- This migration updates the existing Visio pricing matrix to use valid JSON keys

UPDATE pricing_matrices 
SET matrix = jsonb_set(
  matrix,
  '{rate_structure,program_adjustments,dscr_adjustments}',
  '{
    "dscr_gt_1_20": -0.125,
    "dscr_lt_1_00_to_0_75_ltv_le_65": 0.500,
    "dscr_lt_1_00": "case-by-case"
  }'::jsonb
)
WHERE lender_id = 'visio' AND loan_program = 'DSCR';

-- Also fix the notes section
UPDATE pricing_matrices 
SET matrix = jsonb_set(
  matrix,
  '{base_rates,notes}',
  '{
    "refinance_min_fico": 720,
    "dscr_gt_1_20_not_available_on_io": true
  }'::jsonb
)
WHERE lender_id = 'visio' AND loan_program = 'DSCR';
CREATE TABLE pricing_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_id UUID NOT NULL REFERENCES lenders(id),
    effective_date DATE NOT NULL,
    rates_and_adjustments JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_lender_id ON pricing_matrices(lender_id);

COMMENT ON TABLE pricing_matrices IS 'Stores loan pricing data, including rates and adjustments, from various lenders.';
COMMENT ON COLUMN pricing_matrices.lender_id IS 'Foreign key referencing the lender.';
COMMENT ON COLUMN pricing_matrices.effective_date IS 'The date from which this pricing matrix is effective.';
COMMENT ON COLUMN pricing_matrices.rates_and_adjustments IS 'A JSONB object containing base rates, adjustments, and other pricing data.'; CREATE TABLE eligibility_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_id UUID NOT NULL,
    effective_date DATE NOT NULL,
    rules JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eligibility_lender_id ON eligibility_matrices(lender_id);

COMMENT ON TABLE eligibility_matrices IS 'Stores loan eligibility rules, such as FICO score ranges, LTV limits, and state restrictions.';
COMMENT ON COLUMN eligibility_matrices.lender_id IS 'Foreign key referencing the lender.';
COMMENT ON COLUMN eligibility_matrices.effective_date IS 'The date from which this eligibility matrix is effective.';
COMMENT ON COLUMN eligibility_matrices.rules IS 'A JSONB object containing various eligibility criteria.';

ALTER TABLE pricing_matrices
ADD COLUMN eligibility_matrix_id UUID REFERENCES eligibility_matrices(id);

COMMENT ON COLUMN pricing_matrices.eligibility_matrix_id IS 'Foreign key referencing the associated eligibility matrix.';

ALTER TABLE pricing_matrices
RENAME COLUMN rates_and_adjustments TO pricing_data;

COMMENT ON COLUMN pricing_matrices.pricing_data IS 'A JSONB object containing base rates, adjustments, and other pricing data.'; 