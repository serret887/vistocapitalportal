# LLM Prompt for Loan Pricing Matrix Extraction

## Prompt Template

You are an expert loan pricing analyst. I will provide you with an image of a loan pricing matrix/rate sheet for a mortgage program. Your task is to extract ALL the information systematically and structure it into a comprehensive JSON format.

## Instructions

1. **SCAN THE ENTIRE IMAGE** - Don't miss any sections, tables, footnotes, or asterisks
2. **READ ALL FOOTNOTES AND ASTERISKS** - These contain critical business rules
3. **TRACE EVERY ASTERISK** - Find where each asterisk appears and what rule it references
4. **EXTRACT SYSTEMATICALLY** - Follow the structure below exactly
5. **BE PRECISE** - Use exact values, don't round or estimate
6. **INCLUDE EVERYTHING** - Even if a section seems minor, include it

## Required Output Structure

```json
{
  "lender_info": {
    "lender_name": "string",
    "program_name": "string",
    "loan_type": "string",
    "document_title": "string"
  },
  "base_rate_matrix": {
    "credit_score_ranges": [
      {
        "range": "string (e.g., '760+', '740-759')",
        "ltv_rates": {
          "<55": "number",
          "55.01-60": "number",
          "60.01-65": "number",
          "65.01-70": "number",
          "70.01-75": "number",
          "75.01-80": "number"
        }
      }
    ]
  },
  "loan_terms": {
    "term_amortization": "string",
    "max_ltv": "number",
    "underwriting_fee": "number",
    "small_loan_fee": {
      "amount": "number",
      "applies_to": "string"
    }
  },
  "borrower_requirements": {
    "borrower_types": ["array of strings"],
    "citizenship": ["array of strings"],
    "minimum_assets": "string",
    "credit": {
      "middle_score_of_3": "boolean",
      "min_active_tradelines": "boolean",
      "dil_seasoning": "string",
      "late_payment_limitations": "boolean"
    }
  },
  "property_requirements": {
    "property_types": ["array of strings"],
    "min_property_value": "number or string",
    "property_condition": "string",
    "dscr": "string",
    "lease_status": "string"
  },
  "rate_adjustments": {
    "rate_structure": [
      {
        "type": "string (e.g., '5/6 ARM')",
        "adjustment": "number"
      }
    ],
    "origination_fee": [
      {
        "percentage": "string",
        "adjustment": "number"
      }
    ],
    "loan_size": [
      {
        "range": "string",
        "adjustment": "number"
      }
    ],
    "prepayment_penalty": [
      {
        "structure": "string (e.g., '5/5/5/5/5', '3/3/3')",
        "adjustment": "number",
        "asterisk_notes": "string if any"
      }
    ],
    "program_type": [
      {
        "type": "string",
        "adjustment": "number"
      }
    ],
    "property_type": [
      {
        "type": "string",
        "adjustment": "number"
      }
    ],
    "dscr_ltv_only": [
      {
        "condition": "string",
        "adjustment": "number",
        "asterisk_notes": "string if any"
      }
    ]
  },
  "broker_compensation": {
    "broker_payout": [
      {
        "points": "number",
        "rate_add_on": "number"
      }
    ]
  },
  "ineligible_states": ["array of state codes"],
  "business_rules": {
    "conditional_requirements": [
      {
        "condition": "object describing the condition",
        "requirements": "object describing requirements",
        "restrictions": "object describing restrictions",
        "error_message": "string"
      }
    ],
    "state_rules": [
      {
        "states": ["array of state codes"],
        "condition": "object (optional)",
        "requirements": "object",
        "restrictions": "object (optional)",
        "error_message": "string"
      }
    ],
    "rate_rules": [
      {
        "condition": "object",
        "requirements": "object",
        "error_message": "string"
      }
    ]
  },
  "footnotes_and_asterisks": {
    "all_footnotes": ["array of all footnote text"],
    "asterisk_mappings": [
      {
        "asterisk": "string (e.g., '*', '**')",
        "appears_on": "string (where it appears)",
        "rule": "string (what it means)"
      }
    ]
  }
}
```

## Critical Areas to Check

### 1. Base Rate Matrix

- Extract the complete credit score vs LTV grid
- Note any asterisks on specific cells
- Capture exact decimal values

### 2. Rate Adjustments Section

- **Rate Structure**: ARM vs Fixed adjustments
- **Origination Fee**: All percentage tiers and their adjustments
- **Loan Size**: All loan amount ranges and adjustments
- **Prepayment Penalties**: All structures (5/5/5/5/5, 3/3/3, 5/4/3/2/1, 3/2/1, 3/0/0, 0/0/0)
- **Program Type**: Cash-out refinance, short-term rental adjustments
- **Property Type**: Condo, 2-4 unit adjustments
- **DSCR/LTV**: Special conditions like "DSCR > 1.20" or "DSCR < 1 to 0.75"

### 3. Footnotes (CRITICAL)

Look for notes like:

- "720 Fico required for Refinance"
- "Not available on IO"
- "Zero-prepayment penalty required in [states]"
- "Not eligible in [state]"
- "Available only on [specific conditions]"
- "Minimum rate X.XX% for [specific structure]"

### 4. State-Specific Rules

- Find lists of ineligible states (often in small text)
- Look for state-specific loan amount limits
- Check for state-specific prepayment requirements

### 5. Loan Terms and Fees

- Underwriting fees
- Small loan fees and their conditions
- Maximum LTV
- Term/amortization details

### 6. Requirements Sections

- Borrower types and citizenship requirements
- Property requirements (types, condition, DSCR, lease status)
- Credit requirements (scores, tradelines, seasoning)
- Asset requirements

## Special Instructions

1. **Asterisk Tracing**: For every asterisk you see, note:

   - Where it appears (which section/value)
   - What footnote it references
   - The exact rule it creates

2. **State Codes**: Convert full state names to 2-letter codes where needed

3. **Number Formatting**:

   - Rates as decimals (6.25, not 6.25%)
   - Adjustments with proper signs (+0.250, -0.150)
   - Dollar amounts as numbers (1500, not $1,500)

4. **Conditional Logic**: For complex rules, structure as:

   ```json
   {
     "condition": {"field": "value" or {"operator": value}},
     "requirements": {"field": value},
     "restrictions": {"field": false},
     "error_message": "Human readable message"
   }
   ```

5. **Missing Information**: If a typical section is not visible, note it as:
   ```json
   "section_name": "NOT_VISIBLE_IN_IMAGE"
   ```

## Validation Checklist

Before submitting, verify you have:

- [ ] All credit score ranges and their LTV rates
- [ ] Every rate adjustment category with all tiers
- [ ] All footnotes transcribed exactly
- [ ] Every asterisk traced to its rule
- [ ] All state-specific rules captured
- [ ] Loan terms and fees documented
- [ ] Borrower and property requirements listed
- [ ] Broker compensation structure included
- [ ] Business rules properly structured with conditions

## Example of Complex Business Rule Extraction

If you see: "3/3/3 **\*** Available only on 5/6 ARM with 720+ FICO, No IO, DSCR ≥ 1 only"

Structure as:

```json
{
  "condition": { "prepay_structure": "3/3/3" },
  "requirements": {
    "product": "5/6 ARM",
    "min_fico": 720,
    "interest_only": false,
    "min_dscr": 1.0
  },
  "error_message": "3/3/3 prepayment available only on 5/6 ARM with 720+ FICO, No IO, DSCR ≥ 1 only"
}
```

## Complete Example Output

Here's a full example based on the Visio DSCR 30-Year loan program:

```json
{
  "lender_info": {
    "lender_name": "Visio",
    "program_name": "DSCR 30 Years",
    "loan_type": "DSCR",
    "document_title": "30 Year Loans for Residential and Vacation Rental Properties"
  },
  "base_rate_matrix": {
    "credit_score_ranges": [
      {
        "range": "760+",
        "ltv_rates": {
          "<55": 5.9,
          "55.01-60": 5.975,
          "60.01-65": 6.1,
          "65.01-70": 6.25,
          "70.01-75": 6.45,
          "75.01-80": 6.7
        }
      },
      {
        "range": "740-759",
        "ltv_rates": {
          "<55": 6.025,
          "55.01-60": 6.1,
          "60.01-65": 6.225,
          "65.01-70": 6.375,
          "70.01-75": 6.575,
          "75.01-80": 6.825
        }
      },
      {
        "range": "720-739",
        "ltv_rates": {
          "<55": 6.25,
          "55.01-60": 6.325,
          "60.01-65": 6.45,
          "65.01-70": 6.6,
          "70.01-75": 6.8,
          "75.01-80": 7.05
        }
      },
      {
        "range": "700-719",
        "ltv_rates": {
          "<55": 6.55,
          "55.01-60": 6.625,
          "60.01-65": 6.65,
          "65.01-70": 6.8,
          "70.01-75": 7.0,
          "75.01-80": 7.65
        }
      },
      {
        "range": "680-699",
        "ltv_rates": {
          "<55": 7.125,
          "55.01-60": 7.125,
          "60.01-65": 7.125,
          "65.01-70": 7.25,
          "70.01-75": 7.625,
          "75.01-80": "N/A"
        }
      }
    ]
  },
  "loan_terms": {
    "term_amortization": "30 Years (no balloons)",
    "max_ltv": 80,
    "underwriting_fee": 1645,
    "small_loan_fee": {
      "amount": 1500,
      "applies_to": "loans between $75k and <$125k"
    }
  },
  "borrower_requirements": {
    "borrower_types": [
      "investor_only",
      "individuals",
      "llcs",
      "corporations",
      "limited_partnerships"
    ],
    "citizenship": ["us_citizens", "permanent_resident_aliens"],
    "minimum_assets": "6 mos PITIA net of down payment and closing costs",
    "credit": {
      "middle_score_of_3": true,
      "min_active_tradelines": true,
      "dil_seasoning": "3 yrs",
      "late_payment_limitations": true
    }
  },
  "property_requirements": {
    "property_types": ["1-4_unit_sfr", "townhomes", "condos"],
    "min_property_value": "125k (higher minimums in certain areas)",
    "property_condition": "C1-C4 (no deferred maintenance)",
    "dscr": "Min. 1.00 (some exceptions apply)",
    "lease_status": "Leased or unleased; must be rent ready"
  },
  "rate_adjustments": {
    "rate_structure": [
      {
        "type": "5/6 ARM",
        "adjustment": 0.0
      },
      {
        "type": "7/6 ARM",
        "adjustment": 0.1
      },
      {
        "type": "30 Year Fixed",
        "adjustment": 0.2
      },
      {
        "type": "IO",
        "adjustment": 0.25,
        "asterisk_notes": "Not available on IO"
      }
    ],
    "origination_fee": [
      { "percentage": "0%", "adjustment": 0.0 },
      { "percentage": "0.5%", "adjustment": -0.15 },
      { "percentage": "1%", "adjustment": -0.3 },
      { "percentage": "1.5%", "adjustment": -0.45 },
      { "percentage": "2%", "adjustment": -0.6 },
      { "percentage": "2.5%", "adjustment": -0.7 },
      { "percentage": "3%", "adjustment": -0.8 }
    ],
    "loan_size": [
      { "range": "$2,000,000+", "adjustment": 0.75 },
      { "range": "$1,500,000 to $2,000,000", "adjustment": 0.25 },
      { "range": "$250k to $1,499,999", "adjustment": 0.0 },
      { "range": "$125k to $249,999", "adjustment": 0.25 },
      { "range": "$100k to $124,999", "adjustment": 0.5 },
      { "range": "$75k to $99,000", "adjustment": 1.25 }
    ],
    "prepayment_penalty": [
      {
        "structure": "5/5/5/5/5",
        "adjustment": -0.25,
        "asterisk_notes": "Not eligible in MS"
      },
      {
        "structure": "3/3/3",
        "adjustment": -0.175,
        "asterisk_notes": "Available only on 5/6 ARM with 720+ FICO, No IO, DSCR ≥ 1 only"
      },
      { "structure": "5/4/3/2/1", "adjustment": 0.0 },
      { "structure": "3/2/1", "adjustment": 0.25 },
      { "structure": "3/0/0", "adjustment": 0.5 },
      {
        "structure": "0/0/0",
        "adjustment": 1.0,
        "asterisk_notes": "Zero-prepayment penalty required in NM, KS,OH,MD, RI (Purchase)"
      }
    ],
    "program_type": [
      { "type": "Cash-Out Refinance", "adjustment": 0.375 },
      { "type": "Short-Term Rental Properties", "adjustment": 0.25 }
    ],
    "property_type": [
      { "type": "Condo Properties", "adjustment": 0.2 },
      { "type": "2-4 Units", "adjustment": 0.25 }
    ],
    "dscr_ltv_only": [
      {
        "condition": "DSCR > 1.20",
        "adjustment": -0.125,
        "asterisk_notes": "Not available on IO"
      },
      { "condition": "DSCR < 1 to 0.75, LTV ≤ 65", "adjustment": 0.5 }
    ]
  },
  "broker_compensation": {
    "broker_payout": [
      { "points": 0.25, "rate_add_on": 0.062 },
      { "points": 0.5, "rate_add_on": 0.125 },
      { "points": 0.75, "rate_add_on": 0.187 },
      { "points": 1, "rate_add_on": 0.25 },
      { "points": 1.25, "rate_add_on": 0.312 },
      { "points": 1.5, "rate_add_on": 0.375 },
      { "points": 1.75, "rate_add_on": 0.437 },
      { "points": 2, "rate_add_on": 0.5 }
    ]
  },
  "ineligible_states": ["AK", "MN", "NE", "NV", "ND", "OR", "SD", "UT", "VT"],
  "business_rules": {
    "conditional_requirements": [
      {
        "condition": { "loan_purpose": "refinance" },
        "requirements": { "min_fico": 720 },
        "error_message": "720 FICO required for Refinance"
      },
      {
        "condition": { "dscr": { "lt": 1.0, "gte": 0.75 } },
        "requirements": { "max_ltv": 65 },
        "error_message": "LTV must be ≤ 65% when DSCR < 1.00 to 0.75"
      },
      {
        "condition": { "dscr": { "gt": 1.2 } },
        "restrictions": { "interest_only": false },
        "error_message": "Interest Only not available when DSCR > 1.20"
      },
      {
        "condition": { "prepay_structure": "3/3/3" },
        "requirements": {
          "product": "5/6 ARM",
          "min_fico": 720,
          "interest_only": false,
          "min_dscr": 1.0
        },
        "error_message": "3/3/3 prepayment available only on 5/6 ARM with 720+ FICO, No IO, DSCR ≥ 1 only"
      }
    ],
    "state_rules": [
      {
        "states": ["NM", "KS", "OH", "MD"],
        "requirements": { "zero_prepay_required": true },
        "error_message": "Zero-prepayment penalty required in NM, KS, OH, MD"
      },
      {
        "states": ["RI"],
        "condition": { "loan_purpose": "purchase" },
        "requirements": { "zero_prepay_required": true },
        "error_message": "Zero-prepayment penalty required in RI for Purchase"
      },
      {
        "states": ["PA"],
        "condition": { "loan_amount": { "lt": 319777 } },
        "requirements": { "zero_prepay_required": true },
        "error_message": "Zero-prepayment penalty required in PA for loans under $319,777"
      },
      {
        "states": ["MS"],
        "restrictions": { "prepay_structure": ["5/5/5/5/5"] },
        "error_message": "5/5/5/5/5 prepayment penalty not eligible in MS"
      }
    ],
    "rate_rules": [
      {
        "condition": { "prepay_structure": "3/3/3" },
        "requirements": { "min_rate": 6.25 },
        "error_message": "Minimum rate 6.25% for 3/3/3 prepayment penalty"
      }
    ]
  },
  "footnotes_and_asterisks": {
    "all_footnotes": [
      "720 Fico required for Refinance",
      "Not available on IO",
      "Zero-prepayment penalty required in NM, KS,OH,MD, RI (Purchase)",
      "PA Loan Amount < $319,777",
      "Not eligible in MS",
      "Available only on 5/6 ARM with 720+ FICO, No IO, DSCR ≥ 1 only",
      "Minimum rate 6.25% for 3/3/3 only for 3/3/3 only"
    ],
    "asterisk_mappings": [
      {
        "asterisk": "*",
        "appears_on": "720 Fico required for Refinance",
        "rule": "Refinance loans require minimum 720 FICO score"
      },
      {
        "asterisk": "**",
        "appears_on": "IO*, DSCR > 1.20**",
        "rule": "Not available on Interest Only loans"
      },
      {
        "asterisk": "***",
        "appears_on": "0/0/0***",
        "rule": "Zero-prepayment penalty required in NM, KS,OH,MD, RI (Purchase) and PA Loan Amount < $319,777"
      },
      {
        "asterisk": "****",
        "appears_on": "5/5/5/5/5 ****",
        "rule": "Not eligible in MS"
      },
      {
        "asterisk": "*****",
        "appears_on": "3/3/3 *****",
        "rule": "Available only on 5/6 ARM with 720+ FICO, No IO, DSCR ≥ 1 only"
      }
    ]
  }
}
```

## Output Format

Provide the complete JSON structure with all extracted data following the example above. If any section is unclear or partially visible, note it in comments within the JSON or as a separate "extraction_notes" section.
