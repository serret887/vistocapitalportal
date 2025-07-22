-- Fix variable names in pricing matrix by replacing dots with underscores
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
