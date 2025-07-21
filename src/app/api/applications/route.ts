import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { LoanApplicationFormData } from '@/types'

// GET /api/applications - List all applications for the current partner
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get partner profile
    const { data: partnerProfile, error: partnerError } = await supabase
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
    const { data: applications, error: applicationsError } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('partner_id', partnerProfile.id)
      .order('created_at', { ascending: false })

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError)
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
    // Get current user
    const { user, error: userError } = await getCurrentUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get partner profile
    const { data: partnerProfile, error: partnerError } = await supabase
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

    // Parse request body
    const formData: LoanApplicationFormData = await request.json()

    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Prepare application data for database
    const applicationData = {
      partner_id: partnerProfile.id,
      
      // Personal Info
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone_number: formData.phone_number || null,
      ssn: formData.ssn || null,
      date_of_birth: formData.date_of_birth || null,
      
      // Property Info
      property_address: formData.property_address || null,
      property_is_tbd: formData.property_is_tbd || false,
      property_type: formData.property_type || null,
      current_residence: formData.current_residence || null,
      
      // Loan Information
      loan_objective: formData.loan_objective || null,
      loan_type: formData.loan_type || null,
      
      // Income Information
      total_income: formData.total_income || 0,
      income_sources: formData.income_sources || [],
      income_documents: [], // Will be populated after file upload
      
      // Assets Information
      total_assets: formData.total_assets || 0,
      bank_accounts: formData.bank_accounts || [],
      bank_statements: [], // Will be populated after file upload
      
      // Status
      status: 'in_review'
    }

    // Insert application into database
    const { data: application, error: insertError } = await supabase
      .from('loan_applications')
      .insert([applicationData])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating application:', insertError)
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      application,
      success: true,
      message: 'Application created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 