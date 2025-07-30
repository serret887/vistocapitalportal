import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth'
import { getAuthenticatedUser } from '@/lib/auth'

// POST /api/applications/borrower - Create a new borrower application
export async function POST(request: NextRequest) {
  try {
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const serverSupabase = createServerSupabaseClient()

    // Get partner profile
    const { data: partnerProfile, error: partnerError } = await serverSupabase
      .from('partner_profiles')
      .select('id, first_name, last_name, email, phone_number')
      .eq('user_id', user.id)
      .single()

    if (partnerError) {
      if (partnerError.code === '42P01' || partnerError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Onboarding required', needsOnboarding: true },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 404 }
      )
    }

    if (!partnerProfile) {
      return NextResponse.json(
        { error: 'Onboarding required', needsOnboarding: true },
        { status: 403 }
      )
    }

    const formData = await request.json()

    // Basic validation
    if (!formData.application_name || !formData.primary_borrower) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Start a transaction
    const { data: application, error: applicationError } = await serverSupabase
      .from('loan_applications')
      .insert({
        partner_id: partnerProfile.id,
        application_name: formData.application_name,
        application_type: formData.application_type || 'loan_application',
        notes: formData.notes,
        status: 'in_review'
      })
      .select()
      .single()

    if (applicationError) {
      console.error('Application creation error:', applicationError)
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
    }

    // Create primary borrower
    const { data: borrower, error: borrowerError } = await serverSupabase
      .from('borrowers')
      .insert({
        first_name: formData.primary_borrower.first_name,
        last_name: formData.primary_borrower.last_name,
        email: formData.primary_borrower.email,
        phone_number: formData.primary_borrower.phone_number,
        ssn: formData.primary_borrower.ssn,
        date_of_birth: formData.primary_borrower.date_of_birth,
        current_residence: formData.primary_borrower.current_residence,
        total_income: formData.primary_borrower.total_income,
        income_sources: formData.primary_borrower.income_sources,
        income_documents: formData.primary_borrower.income_documents,
        total_assets: formData.primary_borrower.total_assets,
        bank_accounts: formData.primary_borrower.bank_accounts,
        bank_statements: formData.primary_borrower.bank_statements
      })
      .select()
      .single()

    if (borrowerError) {
      console.error('Borrower creation error:', borrowerError)
      return NextResponse.json(
        { error: 'Failed to create borrower' },
        { status: 500 }
      )
    }

    // Link borrower to application as primary
    const { error: borrowerApplicationError } = await serverSupabase
      .from('borrower_applications')
      .insert({
        borrower_id: borrower.id,
        application_id: application.id,
        borrower_role: 'primary'
      })

    if (borrowerApplicationError) {
      console.error('Borrower application link error:', borrowerApplicationError)
      return NextResponse.json(
        { error: 'Failed to link borrower to application' },
        { status: 500 }
      )
    }

    // Handle company information if provided
    if (formData.primary_borrower.has_company && formData.primary_borrower.company) {
      const companyData = formData.primary_borrower.company
      
      // Create company
      const { data: company, error: companyError } = await serverSupabase
        .from('companies')
        .insert({
          company_name: companyData.company_name,
          company_type: companyData.company_type,
          ein: companyData.ein,
          business_address: companyData.business_address,
          business_phone: companyData.business_phone,
          business_email: companyData.business_email,
          industry: companyData.industry,
          years_in_business: companyData.years_in_business,
          annual_revenue: companyData.annual_revenue,
          number_of_employees: companyData.number_of_employees
        })
        .select()
        .single()

      if (companyError) {
        console.error('Company creation error:', companyError)
        return NextResponse.json(
          { error: 'Failed to create company' },
          { status: 500 }
        )
      }

      // Link borrower to company
      const { error: borrowerCompanyError } = await serverSupabase
        .from('borrower_companies')
        .insert({
          borrower_id: borrower.id,
          company_id: company.id,
          ownership_percentage: companyData.ownership_percentage,
          role_in_company: companyData.role_in_company
        })

      if (borrowerCompanyError) {
        console.error('Borrower company link error:', borrowerCompanyError)
        return NextResponse.json(
          { error: 'Failed to link borrower to company' },
          { status: 500 }
        )
      }
    }

    // Handle additional borrowers if any
    if (formData.borrowers && formData.borrowers.length > 1) {
      for (let i = 1; i < formData.borrowers.length; i++) {
        const additionalBorrower = formData.borrowers[i]
        
        // Create additional borrower
        const { data: additionalBorrowerData, error: additionalBorrowerError } = await serverSupabase
          .from('borrowers')
          .insert({
            first_name: additionalBorrower.first_name,
            last_name: additionalBorrower.last_name,
            email: additionalBorrower.email,
            phone_number: additionalBorrower.phone_number,
            ssn: additionalBorrower.ssn,
            date_of_birth: additionalBorrower.date_of_birth,
            current_residence: additionalBorrower.current_residence,
            total_income: additionalBorrower.total_income,
            income_sources: additionalBorrower.income_sources,
            income_documents: additionalBorrower.income_documents,
            total_assets: additionalBorrower.total_assets,
            bank_accounts: additionalBorrower.bank_accounts,
            bank_statements: additionalBorrower.bank_statements
          })
          .select()
          .single()

        if (additionalBorrowerError) {
          console.error('Additional borrower creation error:', additionalBorrowerError)
          continue // Skip this borrower but continue with others
        }

        // Link additional borrower to application
        await serverSupabase
          .from('borrower_applications')
          .insert({
            borrower_id: additionalBorrowerData.id,
            application_id: application.id,
            borrower_role: 'co_borrower'
          })

        // Handle company information for additional borrower if provided
        if (additionalBorrower.has_company && additionalBorrower.company) {
          const companyData = additionalBorrower.company
          
          // Create company for additional borrower
          const { data: additionalCompany, error: additionalCompanyError } = await serverSupabase
            .from('companies')
            .insert({
              company_name: companyData.company_name,
              company_type: companyData.company_type,
              ein: companyData.ein,
              business_address: companyData.business_address,
              business_phone: companyData.business_phone,
              business_email: companyData.business_email,
              industry: companyData.industry,
              years_in_business: companyData.years_in_business,
              annual_revenue: companyData.annual_revenue,
              number_of_employees: companyData.number_of_employees
            })
            .select()
            .single()

          if (!additionalCompanyError && additionalCompany) {
            // Link additional borrower to company
            await serverSupabase
              .from('borrower_companies')
              .insert({
                borrower_id: additionalBorrowerData.id,
                company_id: additionalCompany.id,
                ownership_percentage: companyData.ownership_percentage,
                role_in_company: companyData.role_in_company
              })
          }
        }
      }
    }

    return NextResponse.json({
      application: {
        id: application.id,
        application_name: application.application_name,
        status: application.status,
        created_at: application.created_at
      },
      message: 'Application created successfully'
    })

  } catch (error) {
    console.error('Borrower application creation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// GET /api/applications/borrower - Get borrower applications for the partner
export async function GET(request: NextRequest) {
  try {
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const serverSupabase = createServerSupabaseClient()

    // Get partner profile
    const { data: partnerProfile, error: partnerError } = await serverSupabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partnerProfile) {
      return NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 404 }
      )
    }

    // Get applications with borrower information
    const { data: applications, error: applicationsError } = await serverSupabase
      .from('loan_applications')
      .select(`
        *,
        borrower_applications (
          borrower_role,
          borrowers (
            id,
            first_name,
            last_name,
            email,
            phone_number,
            borrower_companies (
              ownership_percentage,
              role_in_company,
              companies (
                id,
                company_name,
                company_type
              )
            )
          )
        )
      `)
      .eq('partner_id', partnerProfile.id)
      .order('created_at', { ascending: false })

    if (applicationsError) {
      console.error('Applications fetch error:', applicationsError)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    return NextResponse.json({ applications })

  } catch (error) {
    console.error('Borrower applications fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 