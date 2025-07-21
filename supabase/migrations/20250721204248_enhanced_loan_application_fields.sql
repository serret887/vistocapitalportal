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
