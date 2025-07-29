import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/auth'
import { sendApplicationNotification } from '@/lib/slack-notifications'
import { createDefaultConditions } from '@/lib/conditions'
import type { LoanApplicationFormData } from '@/types'

// GET /api/applications - Get all applications for the current partner
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

    // Get all applications for this partner
    const { data: applications, error } = await serverSupabase
      .from('loan_applications')
      .select('*')
      .eq('partner_id', partnerProfile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      applications: applications || [],
      success: true
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

    // Prepare application data
    const applicationData: any = {
      partner_id: partnerProfile.id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone_number: formData.phone_number,
      property_address: formData.property_address,
      property_is_tbd: formData.property_is_tbd,
      property_type: formData.property_type,
      current_residence: formData.current_residence,
      loan_objective: formData.loan_objective,
      loan_type: formData.loan_type,
      ssn: formData.ssn,
      date_of_birth: formData.date_of_birth,
      total_income: formData.total_income,
      income_sources: formData.income_sources,
      total_assets: formData.total_assets,
      bank_accounts: formData.bank_accounts,
      status: 'in_review'
    }

    // Add DSCR data if available
    if (formData.dscrData) {
      applicationData.dscr_data = formData.dscrData
      applicationData.estimated_home_value = formData.dscrData.estimated_home_value
      applicationData.loan_amount = formData.dscrData.loan_amount
      applicationData.down_payment_percentage = formData.dscrData.down_payment_percentage
      applicationData.monthly_rental_income = formData.dscrData.monthly_rental_income
      applicationData.annual_property_insurance = formData.dscrData.annual_property_insurance
      applicationData.annual_property_taxes = formData.dscrData.annual_property_taxes
      applicationData.monthly_hoa_fee = formData.dscrData.monthly_hoa_fee
      applicationData.is_short_term_rental = formData.dscrData.is_short_term_rental
      applicationData.property_state = formData.dscrData.property_state
      applicationData.broker_points = formData.dscrData.broker_points
      applicationData.broker_admin_fee = formData.dscrData.broker_admin_fee
      applicationData.broker_ysp = formData.dscrData.broker_ysp
      applicationData.selected_loan_product = formData.dscrData.selected_loan
      applicationData.dscr_results = formData.dscrData.dscr_results
      
      // Additional DSCR fields
      applicationData.fico_score_range = formData.dscrData.ficoScoreRange
      applicationData.prepayment_penalty = formData.dscrData.prepaymentPenalty
      applicationData.discount_points = formData.dscrData.discountPoints
      applicationData.transaction_type = formData.dscrData.transactionType
      applicationData.property_zip_code = formData.dscrData.propertyZipCode
      applicationData.property_city = formData.dscrData.propertyCity
      applicationData.property_county = formData.dscrData.propertyCounty
      applicationData.property_occupancy = formData.dscrData.propertyOccupancy
      applicationData.property_use = formData.dscrData.propertyUse
      applicationData.property_condition = formData.dscrData.propertyCondition
      applicationData.property_year_built = formData.dscrData.propertyYearBuilt
      applicationData.property_square_footage = formData.dscrData.propertySquareFootage
      applicationData.property_bedrooms = formData.dscrData.propertyBedrooms
      applicationData.property_bathrooms = formData.dscrData.propertyBathrooms
      applicationData.property_lot_size = formData.dscrData.propertyLotSize
      applicationData.property_zoning = formData.dscrData.propertyZoning
      applicationData.property_appraisal_value = formData.dscrData.propertyAppraisalValue
      applicationData.property_purchase_price = formData.dscrData.propertyPurchasePrice
      applicationData.property_seller_concessions = formData.dscrData.propertySellerConcessions
      applicationData.property_closing_costs = formData.dscrData.propertyClosingCosts
      applicationData.property_repairs_improvements = formData.dscrData.propertyRepairsImprovements
      applicationData.property_reserves = formData.dscrData.propertyReserves
      applicationData.property_escrow_accounts = formData.dscrData.propertyEscrowAccounts
      applicationData.property_flood_insurance = formData.dscrData.propertyFloodInsurance
      applicationData.property_hazard_insurance = formData.dscrData.propertyHazardInsurance
      applicationData.property_title_insurance = formData.dscrData.propertyTitleInsurance
      applicationData.property_survey_fees = formData.dscrData.propertySurveyFees
      applicationData.property_recording_fees = formData.dscrData.propertyRecordingFees
      applicationData.property_transfer_taxes = formData.dscrData.propertyTransferTaxes
      applicationData.property_other_costs = formData.dscrData.propertyOtherCosts
    }

    // Create the application
    const { data: application, error } = await serverSupabase
      .from('loan_applications')
      .insert(applicationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating application:', error)
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
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