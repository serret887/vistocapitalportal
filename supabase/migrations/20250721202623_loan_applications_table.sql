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
