import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest, createServerSupabaseClient } from '@/lib/auth'
import type { LoanApplicationFormData } from '@/types'

// GET /api/applications - Get all applications for the current partner
export async function GET(request: NextRequest) {
  try {
    const { user, error: userError } = await getCurrentUserFromRequest(request)
    
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
    const { user, error: userError } = await getCurrentUserFromRequest(request)
    
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

    const formData: LoanApplicationFormData = await request.json()

    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the application
    const { data: application, error } = await serverSupabase
      .from('loan_applications')
      .insert({
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
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating application:', error)
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
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