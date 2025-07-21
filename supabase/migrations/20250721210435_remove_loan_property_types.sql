-- Remove the loan_property_types column since we simplified the loan selection
-- Now we only use loan_objective (refi/purchase) and loan_type (specific type based on objective)
alter table loan_applications drop column if exists loan_property_types;
