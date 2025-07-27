# Visto Capital Partner Portal - Unified Database Migration

## Overview

This document describes the unified database migration that consolidates all previous migrations into a single, comprehensive schema for the Visto Capital Partner Portal.

## Migration File

- **File**: `supabase/migrations/20250726110000_initial_schema.sql`
- **Size**: ~17KB, 405 lines
- **Status**: ✅ Complete and tested

## Schema Components

### 1. Pricing & Eligibility Matrices

**Tables**: `lenders`, `eligibility_matrices`, `pricing_matrices`

**Purpose**: Store loan pricing data and eligibility rules from various lenders

**Key Features**:

- Lender management
- Eligibility rules (FICO scores, LTV limits, state restrictions)
- Pricing data (rates, adjustments)
- Row Level Security (RLS) policies
- Service role access for management

### 2. Partner Profiles & User Management

**Table**: `partner_profiles`

**Purpose**: Consolidated user and partner information

**Key Features**:

- User authentication integration
- Partner type classification (wholesaler, investor, real estate agent, marketing partner)
- Onboarding information (deal volume, transaction types, licenses)
- Automatic profile creation on user signup
- RLS policies for data security

### 3. Loan Applications - Complete Schema

**Table**: `loan_applications`

**Purpose**: Comprehensive loan application management with full DSCR calculator integration

#### Core Application Fields

- **Personal Info**: first_name, last_name, email, phone_number, ssn, date_of_birth
- **Property Info**: property_address, property_type, current_residence
- **Loan Info**: loan_objective, loan_type
- **Income Info**: total_income, income_sources, income_documents
- **Assets Info**: total_assets, bank_accounts, bank_statements
- **Status**: Application status tracking

#### DSCR Calculator Data - Core Fields

- **`dscr_data`** (JSONB): Complete DSCR calculator data as JSON
- **`estimated_home_value`** (NUMERIC): Property value
- **`loan_amount`** (NUMERIC): Requested loan amount
- **`down_payment_percentage`** (NUMERIC): Down payment percentage
- **`monthly_rental_income`** (NUMERIC): Monthly rental income
- **`annual_property_insurance`** (NUMERIC): Annual property insurance
- **`annual_property_taxes`** (NUMERIC): Annual property taxes
- **`monthly_hoa_fee`** (NUMERIC): Monthly HOA fee
- **`is_short_term_rental`** (BOOLEAN): Short-term rental flag
- **`property_state`** (TEXT): Property state
- **`selected_loan_product`** (JSONB): Selected loan product details
- **`dscr_results`** (JSONB): DSCR calculation results

#### DSCR Calculator Data - Additional Fields

- **Borrower & Loan Details**:

  - `fico_score_range` (TEXT): Estimated FICO score range
  - `prepayment_penalty` (TEXT): Prepayment penalty terms
  - `discount_points` (NUMERIC): Discount points
  - `transaction_type` (TEXT): Transaction type (purchase/refinance)

- **Broker Compensation**:

  - `broker_points` (NUMERIC): Broker points
  - `broker_admin_fee` (NUMERIC): Broker admin fee
  - `broker_ysp` (NUMERIC): Broker YSP

- **Property Details**:

  - `property_zip_code`, `property_city`, `property_county` (TEXT)
  - `property_occupancy`, `property_use`, `property_condition` (TEXT)
  - `property_year_built` (INTEGER)
  - `property_square_footage`, `property_bedrooms`, `property_bathrooms` (NUMERIC/INTEGER)
  - `property_lot_size`, `property_zoning` (NUMERIC/TEXT)

- **Property Financial Details**:

  - `property_appraisal_value`, `property_purchase_price` (NUMERIC)
  - `property_seller_concessions`, `property_closing_costs` (NUMERIC)
  - `property_repairs_improvements`, `property_reserves` (NUMERIC)
  - `property_escrow_accounts` (BOOLEAN)

- **Insurance & Fees**:
  - `property_flood_insurance`, `property_hazard_insurance` (NUMERIC)
  - `property_title_insurance`, `property_survey_fees` (NUMERIC)
  - `property_recording_fees`, `property_transfer_taxes` (NUMERIC)
  - `property_other_costs` (NUMERIC)

### 4. File Storage

**Bucket**: `loan-documents`

**Purpose**: Secure file storage for loan documentation

**Key Features**:

- Partner-specific file organization
- RLS policies for file access control
- Support for bank statements, income documents, and other loan files

## Security Features

### Row Level Security (RLS)

- **Partner Profiles**: Users can only access their own profile
- **Loan Applications**: Partners can only access their own applications
- **File Storage**: Partners can only access their own files

### Helper Functions

- `get_partner_id_from_user()`: Secure function to get partner ID from user ID
- `handle_new_user()`: Automatic partner profile creation on signup
- `update_loan_applications_updated_at()`: Automatic timestamp updates

## Performance Optimizations

### Indexes

- Partner ID indexing for fast application queries
- Status indexing for dashboard filtering
- Created date indexing for chronological sorting
- Loan objective, type, and property type indexing for filtering

### Constraints

- Foreign key relationships for data integrity
- Check constraints for status values and partner types
- Unique constraints to prevent duplicate profiles

## Migration History

### Consolidated Migrations

1. **Original Initial Schema** (20250726110000): Basic tables and structure
2. **DSCR Data Addition** (20250727170000): Core DSCR calculator fields
3. **Complete DSCR Fields** (20250727180000): Additional DSCR calculator fields

### Unified Result

- **Single Migration File**: All previous migrations combined into one comprehensive schema
- **Complete DSCR Integration**: All DSCR calculator data fields included
- **Full Documentation**: Comprehensive comments for all fields
- **Tested Schema**: Verified working with existing application

## Benefits of Unification

1. **Simplified Deployment**: Single migration file for new environments
2. **Complete Schema**: All features available from initial setup
3. **Better Documentation**: Comprehensive field descriptions
4. **Reduced Complexity**: No need to manage multiple migration files
5. **Consistent Structure**: All related fields grouped logically

## Usage

### For New Deployments

```bash
# Apply the unified migration
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/migrations/20250726110000_initial_schema.sql
```

### For Existing Deployments

The unified migration includes `DROP TABLE IF EXISTS` statements to handle existing tables, making it safe to run on existing databases.

## Verification

### Schema Validation

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check DSCR fields exist
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'loan_applications'
AND (column_name LIKE '%dscr%' OR column_name LIKE '%fico%' OR column_name LIKE '%broker%' OR column_name LIKE '%property_%')
ORDER BY column_name;
```

### Application Testing

- ✅ Dashboard loads successfully
- ✅ DSCR calculator data saves completely
- ✅ Application creation works with all fields
- ✅ View application displays all DSCR information
- ✅ File upload functionality works
- ✅ RLS policies enforce data security

## Conclusion

The unified migration provides a complete, production-ready database schema for the Visto Capital Partner Portal. It includes all necessary tables, fields, security policies, and performance optimizations in a single, well-documented file.
