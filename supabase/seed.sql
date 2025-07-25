-- Clean up existing data
TRUNCATE TABLE pricing_matrices CASCADE;
TRUNCATE TABLE eligibility_matrices CASCADE;
TRUNCATE TABLE lenders CASCADE;

-- Insert lender
INSERT INTO lenders (id, name) 
VALUES ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Visio')
RETURNING id;

-- Insert eligibility matrix with comprehensive business rules
WITH lender AS (
  SELECT id FROM lenders WHERE name = 'Visio'
)
INSERT INTO eligibility_matrices (id, lender_id, effective_date, rules)
VALUES (
  'e290f1ee-6c54-4b01-90e6-d701748f0852',
  (SELECT id FROM lender),
  '2025-07-14',
  '{
    "program": "DSCR 30 Years",
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
      "property_types": ["1-4 Unit SFR", "Townhomes", "Condos"],
      "min_value": 125000,
      "condition": ["C1", "C2", "C3", "C4"],
      "dscr_min": 1.00,
      "lease_status": ["Leased", "Unleased (must be rent ready)"]
    },
    "business_rules": {
      "state_rules": [
        {
          "rule_id": "zero_prepay_NM_KS_OH_MD",
          "states": ["NM", "KS", "OH", "MD"],
          "requirements": {
            "zero_prepay_required": true
          },
          "error_message": "Zero-prepayment penalty (0/0/0) is required in NM, KS, OH, and MD"
        },
        {
          "rule_id": "zero_prepay_RI_purchase",
          "states": ["RI"],
          "condition": {
            "loan_purpose": "purchase"
          },
          "requirements": {
            "zero_prepay_required": true
          },
          "error_message": "Zero-prepayment penalty (0/0/0) is required in RI for Purchase loans"
        },
        {
          "rule_id": "zero_prepay_PA_small_loans",
          "states": ["PA"],
          "condition": {
            "loan_amount": {"lt": 319777}
          },
          "requirements": {
            "zero_prepay_required": true
          },
          "error_message": "Zero-prepayment penalty (0/0/0) is required in PA for loans under $319,777"
        },
        {
          "rule_id": "MS_prepay_restriction",
          "states": ["MS"],
          "restrictions": {
            "prepay_structures": ["5/5/5/5/5"]
          },
          "error_message": "5/5/5/5/5 prepayment penalty structure is not eligible in MS"
        }
      ],
      "loan_purpose_rules": [
        {
          "rule_id": "refinance_fico_requirement",
          "condition": {
            "loan_purpose": "refinance"
          },
          "requirements": {
            "min_fico": 720
          },
          "error_message": "720 FICO score required for Refinance loans"
        }
      ],
      "prepayment_penalty_rules": [
        {
          "rule_id": "prepay_3_3_3_restrictions",
          "condition": {
            "prepay_structure": "3/3/3"
          },
          "requirements": {
            "product": "5/6 ARM",
            "min_fico": 720,
            "interest_only": false,
            "min_dscr": 1.0
          },
          "error_message": "3/3/3 prepayment penalty is only available on 5/6 ARM with 720+ FICO, No Interest Only, and DSCR ≥ 1.0"
        }
      ],
      "dscr_ltv_rules": [
        {
          "rule_id": "low_dscr_ltv_restriction",
          "condition": {
            "dscr": {"lt": 1.0, "gte": 0.75}
          },
          "requirements": {
            "max_ltv": 65
          },
          "error_message": "When DSCR is between 0.75 and 1.0, maximum LTV is 65%"
        }
      ],
      "product_rules": [
        {
          "rule_id": "high_dscr_no_io",
          "condition": {
            "dscr": {"gt": 1.20}
          },
          "restrictions": {
            "interest_only": false
          },
          "error_message": "Interest Only is not available when DSCR > 1.20"
        }
      ],
      "rate_rules": [
        {
          "rule_id": "prepay_3_3_3_min_rate",
          "condition": {
            "prepay_structure": "3/3/3"
          },
          "requirements": {
            "min_rate": 6.25
          },
          "error_message": "Minimum rate of 6.25% applies to 3/3/3 prepayment penalty structure"
        }
      ]
    }
  }'::jsonb
);

-- Insert pricing matrix (moved refinance_min_fico to eligibility matrix)
WITH lender AS (
  SELECT id FROM lenders WHERE name = 'Visio'
), eligibility AS (
  SELECT id FROM eligibility_matrices WHERE lender_id = (SELECT id FROM lender)
)
INSERT INTO pricing_matrices (lender_id, eligibility_matrix_id, effective_date, pricing_data)
VALUES (
  (SELECT id FROM lender),
  (SELECT id FROM eligibility),
  '2025-07-14',
  '{
    "program": "DSCR 30 Years",
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
        "0/0/0": 1.000
      },
      "program_adjustments": {
        "cash_out_refinance": 0.375,
        "short_term_rental": 0.250,
        "condo": 0.200,
        "2_4_units": 0.250,
        "units_adjustment": 0.25,
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
          "<55": 7.125,
          "55.01-60": 7.125,
          "60.01-65": 7.125,
          "65.01-70": 7.250,
          "70.01-75": 7.625,
          "75.01-80": "N/A"
        }
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
); 