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
