import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/auth'
import { sendApplicationNotification } from '@/lib/slack-notifications'
import { createDefaultConditions } from '@/lib/conditions'
import type { LoanApplicationFormData, LoanApplicationWithBorrower } from '@/types'
import { 
  getCorrelationId, 
  logRequest, 
  logResponse, 
  logError, 
  logDebug,
  logWithCorrelation 
} from '@/lib/utils'

// GET /api/applications - Get all applications for the current partner
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  // Log the incoming request
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Getting applications for user')
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for applications', {
        error: userError?.message,
        hasUser: !!user
      })
      
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Authentication required')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'User authenticated for applications', {
      userId: user.id,
      userEmail: user.email
    })

    const serverSupabase = createServerSupabaseClient()

    // Get partner profile
    logWithCorrelation(correlationId, 'debug', 'Fetching partner profile')
    
    const { data: partnerProfile, error: partnerError } = await serverSupabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (partnerError) {
      // If table doesn't exist or no profile found, user needs onboarding
      if (partnerError.code === '42P01' || partnerError.code === 'PGRST116') {
        logWithCorrelation(correlationId, 'warn', 'Partner profile not found - onboarding required', {
          error: partnerError.message,
          code: partnerError.code
        })
        
        const response = NextResponse.json(
          { error: 'Onboarding required', needsOnboarding: true },
          { status: 403 }
        )
        response.headers.set('x-correlation-id', correlationId)
        logResponse(correlationId, 403, 'Onboarding required')
        return response
      }
      
      logWithCorrelation(correlationId, 'error', 'Partner profile error', {
        error: partnerError.message,
        code: partnerError.code
      })
      
      const response = NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 404 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 404, 'Partner profile not found')
      return response
    }

    if (!partnerProfile) {
      logWithCorrelation(correlationId, 'warn', 'No partner profile found - onboarding required')
      
      const response = NextResponse.json(
        { error: 'Onboarding required', needsOnboarding: true },
        { status: 403 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 403, 'Onboarding required')
      return response
    }

    logWithCorrelation(correlationId, 'debug', 'Partner profile found', {
      partnerId: partnerProfile.id
    })

    // Get all applications for this user with related client data
    logWithCorrelation(correlationId, 'debug', 'Fetching applications from database')
    
    const { data: applications, error } = await serverSupabase
      .from('applications')
      .select(`
        *,
        client_applications!inner(
          client:clients(
            id,
            first_name,
            last_name,
            email,
            phone_number,
            ssn,
            date_of_birth,
            current_residence,
            total_income,
            income_sources,
            total_assets,
            bank_accounts
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logWithCorrelation(correlationId, 'error', 'Failed to fetch applications', {
        error: error.message,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to fetch applications')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Applications fetched successfully', {
      userId: user.id,
      applicationCount: applications?.length || 0
    })

    // Transform the data to match the expected format
    const transformedApplications = applications?.map(app => {
      // Get the first client (primary borrower)
      const primaryClient = app.client_applications?.[0]?.client
      
      if (!primaryClient) {
        return {
          ...app,
          first_name: '',
          last_name: '',
          email: '',
          phone_number: '',
          ssn: '',
          date_of_birth: '',
          current_residence: '',
          total_income: 0,
          income_sources: [],
          total_assets: 0,
          bank_accounts: []
        }
      }

      return {
        ...app,
        first_name: primaryClient.first_name || '',
        last_name: primaryClient.last_name || '',
        email: primaryClient.email || '',
        phone_number: primaryClient.phone_number || '',
        ssn: primaryClient.ssn || '',
        date_of_birth: primaryClient.date_of_birth || '',
        current_residence: primaryClient.current_residence || '',
        total_income: primaryClient.total_income || 0,
        income_sources: primaryClient.income_sources || [],
        total_assets: primaryClient.total_assets || 0,
        bank_accounts: primaryClient.bank_accounts || []
      }
    }) || []

    const response = NextResponse.json(transformedApplications)
    response.headers.set('x-correlation-id', correlationId)
    
    logWithCorrelation(correlationId, 'info', 'Applications returned successfully', {
      userId: user.id,
      applicationCount: transformedApplications.length
    })
    
    logResponse(correlationId, 200, 'Applications fetched successfully')
    return response
  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/applications GET' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
}

// POST /api/applications - Create a new application
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
      // If table doesn't exist or no profile found, user needs onboarding
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

    const formData: LoanApplicationFormData & { dscrData?: any } = await request.json()

    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create application
    const { data: application, error: applicationError } = await serverSupabase
      .from('applications')
      .insert({
        user_id: user.id,
        application_name: `${formData.first_name} ${formData.last_name} - ${formData.loan_objective}`,
        application_type: 'loan_application',
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

    // Create client (borrower)
    const { data: client, error: clientError } = await serverSupabase
      .from('clients')
      .insert({
        user_id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        ssn: formData.ssn,
        date_of_birth: formData.date_of_birth,
        current_residence: formData.current_residence,
        total_income: formData.total_income,
        income_sources: formData.income_sources,
        total_assets: formData.total_assets,
        bank_accounts: formData.bank_accounts
      })
      .select()
      .single()

    if (clientError) {
      console.error('Client creation error:', clientError)
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      )
    }

    // Link client to application
    const { error: linkError } = await serverSupabase
      .from('client_applications')
      .insert({
        client_id: client.id,
        application_id: application.id
      })

    if (linkError) {
      console.error('Client-application link error:', linkError)
      return NextResponse.json(
        { error: 'Failed to link client to application' },
        { status: 500 }
      )
    }

    // Create loan if DSCR data is available
    if (formData.dscrData) {
      const loanData: any = {
        user_id: user.id,
        application_id: application.id,
        loan_name: `${formData.first_name} ${formData.last_name} - ${formData.loan_objective}`,
        loan_type: formData.loan_type,
        loan_objective: formData.loan_objective,
        property_address: formData.property_address,
        property_type: formData.property_type,
        estimated_home_value: formData.dscrData.estimated_home_value,
        loan_amount: formData.dscrData.loan_amount,
        down_payment_percentage: formData.dscrData.down_payment_percentage,
        monthly_rental_income: formData.dscrData.monthly_rental_income,
        annual_property_insurance: formData.dscrData.annual_property_insurance,
        annual_property_taxes: formData.dscrData.annual_property_taxes,
        monthly_hoa_fee: formData.dscrData.monthly_hoa_fee,
        is_short_term_rental: formData.dscrData.is_short_term_rental,
        property_state: formData.dscrData.property_state,
        broker_points: formData.dscrData.broker_points,
        broker_admin_fee: formData.dscrData.broker_admin_fee,
        broker_ysp: formData.dscrData.broker_ysp,
        selected_loan_product: formData.dscrData.selected_loan,
        fico_score_range: formData.dscrData.ficoScoreRange,
        prepayment_penalty: formData.dscrData.prepaymentPenalty,
        discount_points: formData.dscrData.discountPoints,
        property_zip_code: formData.dscrData.propertyZipCode,
        property_city: formData.dscrData.propertyCity,
        property_county: formData.dscrData.propertyCounty,
        property_occupancy: formData.dscrData.propertyOccupancy,
        property_use: formData.dscrData.propertyUse,
        property_condition: formData.dscrData.propertyCondition,
        property_year_built: formData.dscrData.propertyYearBuilt,
        property_square_footage: formData.dscrData.propertySquareFootage,
        property_bedrooms: formData.dscrData.propertyBedrooms,
        property_bathrooms: formData.dscrData.propertyBathrooms,
        property_lot_size: formData.dscrData.propertyLotSize,
        property_zoning: formData.dscrData.propertyZoning
      }

      const { error: loanError } = await serverSupabase
        .from('loans')
        .insert(loanData)

      if (loanError) {
        console.error('Loan creation error:', loanError)
        // Don't fail the entire request if loan creation fails
      }
    }



    // Create default conditions for the application
    try {
      const bankAccountsCount = formData.bank_accounts?.length || 0
      await createDefaultConditions(application.id, bankAccountsCount)
    } catch (conditionError) {
      console.error('Failed to create conditions:', conditionError)
      // Don't fail the request if condition creation fails
    }

    // Send Slack notification
    try {
      await sendApplicationNotification(application, partnerProfile)
    } catch (notificationError) {
      console.error('Failed to send Slack notification:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      application,
      success: true,
      message: 'Application created successfully'
    })

  } catch (error) {
    console.error('Unexpected error in POST /api/applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 