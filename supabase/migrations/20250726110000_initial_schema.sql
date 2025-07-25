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

-- Enable RLS
ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_matrices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_matrices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read lenders" ON lenders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read eligibility matrices" ON eligibility_matrices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read pricing matrices" ON pricing_matrices
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create service role policies
CREATE POLICY "Allow service role to manage lenders" ON lenders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage eligibility matrices" ON eligibility_matrices
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role to manage pricing matrices" ON pricing_matrices
    FOR ALL USING (auth.role() = 'service_role');

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
ADD CONSTRAINT partner_profiles_user_id_unique UNIQUE (user_id); 