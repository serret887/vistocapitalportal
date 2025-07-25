-- Clear existing data to ensure a clean slate
DELETE FROM pricing_matrices;
DELETE FROM eligibility_matrices;
DELETE FROM lenders;

-- Seed the lenders table with Rental360
INSERT INTO lenders (id, name, contact_info)
VALUES
    ('1a2b3c4d-5e6f-7890-1234-567890abcdef', 'Rental360', '{"email": "contact@rental360.com"}');

DO $$
DECLARE
    new_lender_id UUID := '1a2b3c4d-5e6f-7890-1234-567890abcdef';
    new_eligibility_id UUID;
BEGIN
    -- Seed the eligibility_matrices table
    INSERT INTO eligibility_matrices (lender_id, effective_date, rules)
    VALUES
        (new_lender_id, '2025-07-14', '{
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
              "late_payment_limitations": true,
              "refinance_min_fico": 720
            }
          },
          "property_requirements": {
            "property_types": ["Single Family", "1-4 Unit SFR", "Townhomes", "Condos"],
            "min_value": 125000,
            "condition": ["C1", "C2", "C3", "C4"],
            "dscr_min": 1.00,
            "lease_status": ["Leased", "Unleased (must be rent ready)"]
          },
          "notes": {
            "dscr_gt_1.20_not_available_on_io": true
          }
        }')
    RETURNING id INTO new_eligibility_id;

    -- Seed the pricing_matrices table
    INSERT INTO pricing_matrices (lender_id, eligibility_matrix_id, effective_date, pricing_data)
    VALUES
        (new_lender_id, new_eligibility_id, '2025-07-14', '{
          "rate_structure": {
            "products": {
              "5_6_ARM": 0.000,
              "7_6_ARM": 0.100,
              "30_Year_Fixed": 0.200,
              "Interest_Only": 0.250
            },
            "origination_fee_adjustments": {
              "0%": 0.000, "0.5%": -0.150, "1%": -0.300, "1.5%": -0.450,
              "2%": -0.600, "2.5%": -0.700, "3%": -0.800
            },
            "loan_size_adjustments": {
              ">=2000000": 0.750, "1500000-1999999": 0.250, "250000-1499999": 0.000,
              "125000-249999": 0.250, "100000-124999": 0.500, "75000-99999": 1.250
            },
            "prepay_penalty_structures": {
              "5/5/5/5/5": -0.250, "3/3/3": -0.175, "5/4/3/2/1": 0.000, "3/2/1": 0.250,
              "3/0/0": 0.500, "0/0/0": 1.000,
              "notes": {
                "zero_prepay_required_in": ["NM", "KS", "OH", "MD", "RI (Purchase)", "PA < $319,777"],
                "3/3/3_restrictions": "Only on 5/6 ARM, 720+ FICO, No IO, DSCR ≥ 1. Min rate 6.25%."
              },
              "not_eligible_in": ["MS"]
            },
            "program_adjustments": {
              "cash_out_refinance": 0.375, "short_term_rental": 0.250, "condo": 0.200,
              "2_4_units": 0.250,
              "dscr_adjustments": {
                "dscr_gt_1.20": -0.125, "dscr_lt_1.00_to_0.75_ltv_le_65": 0.500, "dscr_lt_1.00": "case-by-case"
              }
            },
            "minimum_rate": 6.625
          },
          "base_rates": {
            "tiers": {
              "760+":    { "<55": 5.900, "55.01-60": 5.975, "60.01-65": 6.100, "65.01-70": 6.250, "70.01-75": 6.450, "75.01-80": 6.700 },
              "740-759": { "<55": 6.025, "55.01-60": 6.100, "60.01-65": 6.225, "65.01-70": 6.375, "70.01-75": 6.575, "75.01-80": 6.825 },
              "720-739": { "<55": 6.250, "55.01-60": 6.325, "60.01-65": 6.450, "65.01-70": 6.600, "70.01-75": 6.800, "75.01-80": 7.050 },
              "700-719": { "<55": 6.550, "55.01-60": 6.625, "60.01-65": 6.650, "65.01-70": 6.800, "70.01-75": 7.000, "75.01-80": 7.650 },
              "680-699": { "60.01-65": 7.125, "65.01-70": 7.125, "70.01-75": 7.125, "75.01-80": 7.625 }
            }
          },
          "broker_payout_add_ons": {
            "0.25": 0.062, "0.5": 0.125, "0.75": 0.187, "1": 0.25, "1.25": 0.312,
            "1.5": 0.375, "1.75": 0.437, "2": 0.5
          }
        }');
END $$; 