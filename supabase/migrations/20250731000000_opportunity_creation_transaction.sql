-- =====================================================
-- OPPORTUNITY CREATION TRANSACTION FUNCTION
-- =====================================================
-- This migration adds a transaction function for creating opportunities (applications)
-- with proper error handling and rollback capabilities

-- Function to create an opportunity (application) with all related entities in a transaction
CREATE OR REPLACE FUNCTION create_opportunity_with_transaction(
  p_user_id UUID,
  p_companies JSONB DEFAULT '[]'::jsonb,
  p_clients JSONB DEFAULT '[]'::jsonb,
  p_application_name TEXT DEFAULT NULL,
  p_application_type TEXT DEFAULT 'loan_application',
  p_notes TEXT DEFAULT ''
) RETURNS JSONB AS $$
DECLARE
  v_application_id UUID;
  v_processed_client_ids UUID[] := '{}';
  v_processed_company_ids UUID[] := '{}';
  v_new_client JSONB;
  v_new_company JSONB;
  v_client_id UUID;
  v_company_id UUID;
  v_existing_application JSONB;
  v_user_apps JSONB[];
  v_app_clients JSONB[];
  v_app_client_ids UUID[];
  v_has_same_clients BOOLEAN;
  v_client_company_link JSONB;
  v_client_links JSONB[];
BEGIN
  -- Start transaction
  BEGIN
    -- Step 1: Create all clients first (both new and existing)
    IF p_clients IS NOT NULL AND jsonb_array_length(p_clients) > 0 THEN
      FOR i IN 0..jsonb_array_length(p_clients) - 1 LOOP
        v_new_client := p_clients->i;
        
        IF jsonb_typeof(v_new_client) = 'string' THEN
          -- This is an existing client ID
          v_processed_client_ids := array_append(v_processed_client_ids, (v_new_client#>>'{}')::UUID);
        ELSIF v_new_client->>'id' LIKE 'temp-%' THEN
          -- This is a new client that needs to be created
          INSERT INTO clients (
            user_id,
            first_name,
            last_name,
            email,
            phone_number,
            ssn,
            date_of_birth,
            current_residence,
            total_income,
            income_sources,
            income_documents,
            total_assets,
            bank_accounts,
            bank_statements
          ) VALUES (
            p_user_id,
            v_new_client->>'first_name',
            v_new_client->>'last_name',
            v_new_client->>'email',
            v_new_client->>'phone_number',
            v_new_client->>'ssn',
            (v_new_client->>'date_of_birth')::DATE,
            v_new_client->>'current_residence',
            COALESCE((v_new_client->>'total_income')::NUMERIC, 0),
            COALESCE(v_new_client->'income_sources', '[]'::jsonb),
            COALESCE(v_new_client->'income_documents', '[]'::jsonb),
            COALESCE((v_new_client->>'total_assets')::NUMERIC, 0),
            COALESCE(v_new_client->'bank_accounts', '[]'::jsonb),
            COALESCE(v_new_client->'bank_statements', '[]'::jsonb)
          ) RETURNING id INTO v_client_id;
          
          v_processed_client_ids := array_append(v_processed_client_ids, v_client_id);
        END IF;
      END LOOP;
    END IF;

    -- Step 2: Create all companies
    IF p_companies IS NOT NULL AND jsonb_array_length(p_companies) > 0 THEN
      FOR i IN 0..jsonb_array_length(p_companies) - 1 LOOP
        v_new_company := p_companies->i;
        
        IF jsonb_typeof(v_new_company) = 'string' THEN
          -- This is an existing company ID
          v_processed_company_ids := array_append(v_processed_company_ids, (v_new_company#>>'{}')::UUID);
        ELSIF v_new_company->>'id' LIKE 'temp-%' THEN
          -- This is a new company that needs to be created
          INSERT INTO companies (
            user_id,
            company_name,
            company_type,
            ein,
            business_address,
            business_phone,
            business_email,
            industry,
            years_in_business,
            annual_revenue,
            number_of_employees
          ) VALUES (
            p_user_id,
            v_new_company->>'company_name',
            v_new_company->>'company_type',
            v_new_company->>'ein',
            v_new_company->>'business_address',
            v_new_company->>'business_phone',
            v_new_company->>'business_email',
            v_new_company->>'industry',
            (v_new_company->>'years_in_business')::INTEGER,
            COALESCE((v_new_company->>'annual_revenue')::NUMERIC, 0),
            (v_new_company->>'number_of_employees')::INTEGER
          ) RETURNING id INTO v_company_id;
          
          v_processed_company_ids := array_append(v_processed_company_ids, v_company_id);
        END IF;
      END LOOP;
    END IF;

    -- Step 3: Link clients to companies (if both exist)
    IF array_length(v_processed_client_ids, 1) > 0 AND array_length(v_processed_company_ids, 1) > 0 THEN
      FOREACH v_client_id IN ARRAY v_processed_client_ids LOOP
        FOREACH v_company_id IN ARRAY v_processed_company_ids LOOP
          INSERT INTO client_companies (
            client_id,
            company_id,
            ownership_percentage,
            role_in_company
          ) VALUES (
            v_client_id,
            v_company_id,
            100, -- Default to 100% ownership
            'Owner' -- Default role
          );
        END LOOP;
      END LOOP;
    END IF;

    -- Step 4: Check for existing applications with the same clients
    IF array_length(v_processed_client_ids, 1) > 0 THEN
      -- Get all applications for this user
      SELECT jsonb_agg(to_jsonb(app)) INTO v_user_apps
      FROM applications app
      WHERE app.user_id = p_user_id;
      
      IF v_user_apps IS NOT NULL THEN
        FOR i IN 0..jsonb_array_length(v_user_apps) - 1 LOOP
          -- Get clients for this application
          SELECT jsonb_agg(to_jsonb(ca)) INTO v_app_clients
          FROM client_applications ca
          WHERE ca.application_id = (v_user_apps->i->>'id')::UUID;
          
          IF v_app_clients IS NOT NULL THEN
            -- Extract client IDs
            v_app_client_ids := '{}';
            FOR j IN 0..jsonb_array_length(v_app_clients) - 1 LOOP
              v_app_client_ids := array_append(v_app_client_ids, (v_app_clients->j->>'client_id')::UUID);
            END LOOP;
            
            -- Check if all processed clients are in this application and vice versa
            v_has_same_clients := true;
            
            -- Check if all processed clients are in the app
            FOREACH v_client_id IN ARRAY v_processed_client_ids LOOP
              IF NOT (v_client_id = ANY(v_app_client_ids)) THEN
                v_has_same_clients := false;
                EXIT;
              END IF;
            END LOOP;
            
            -- Check if all app clients are in processed clients and same count
            IF v_has_same_clients AND array_length(v_processed_client_ids, 1) = array_length(v_app_client_ids, 1) THEN
              FOREACH v_client_id IN ARRAY v_app_client_ids LOOP
                IF NOT (v_client_id = ANY(v_processed_client_ids)) THEN
                  v_has_same_clients := false;
                  EXIT;
                END IF;
              END LOOP;
              
              IF v_has_same_clients THEN
                v_existing_application := v_user_apps->i;
                EXIT;
              END IF;
            END IF;
          END IF;
        END LOOP;
      END IF;
    END IF;

    -- If existing application found, raise error
    IF v_existing_application IS NOT NULL THEN
      RAISE EXCEPTION 'An application with these companies and clients already exists (ID: %)', v_existing_application->>'id';
    END IF;

    -- Step 5: Create the application
    INSERT INTO applications (
      user_id,
      application_name,
      application_type,
      notes,
      status
    ) VALUES (
      p_user_id,
      COALESCE(p_application_name, 'Application - ' || to_char(NOW(), 'MM/DD/YYYY')),
      p_application_type,
      p_notes,
      'in_review'
    ) RETURNING id INTO v_application_id;

    -- Step 6: Link clients to the application
    IF array_length(v_processed_client_ids, 1) > 0 THEN
      FOREACH v_client_id IN ARRAY v_processed_client_ids LOOP
        INSERT INTO client_applications (
          application_id,
          client_id
        ) VALUES (
          v_application_id,
          v_client_id
        );
      END LOOP;
    END IF;

    -- Return success result
    RETURN jsonb_build_object(
      'success', true,
      'application_id', v_application_id,
      'processed_client_ids', v_processed_client_ids,
      'processed_company_ids', v_processed_company_ids
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction by raising the error
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_opportunity_with_transaction(UUID, JSONB, JSONB, TEXT, TEXT, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_opportunity_with_transaction IS 'Creates an opportunity (application) with all related entities in a transaction. Handles creation of new clients and companies, linking them together, and creating the application. Returns application details on success or rolls back all changes on failure.'; 