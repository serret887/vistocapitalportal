import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { LoanApplicationStatus } from '@/types'

interface RouteParams {
  params: {
    id: string
  }
}

// PUT /api/applications/[id]/status - Update application status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
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
    const { status } = await request.json()

    // Validate status
    const validStatuses: LoanApplicationStatus[] = [
      'in_review',
      'approved', 
      'ineligible',
      'denied',
      'closed',
      'missing_conditions',
      'pending_documents'
    ]

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status provided' },
        { status: 400 }
      )
    }

    // Validate the application exists and belongs to this partner
    const { data: existingApplication, error: existingError } = await supabase
      .from('loan_applications')
      .select('id, status, first_name, last_name')
      .eq('id', params.id)
      .eq('partner_id', partnerProfile.id)
      .single()

    if (existingError || !existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if status is actually changing
    if (existingApplication.status === status) {
      return NextResponse.json(
        { error: 'Application already has this status' },
        { status: 400 }
      )
    }

    // Update the application status
    const { data: application, error: updateError } = await supabase
      .from('loan_applications')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('partner_id', partnerProfile.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating application status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application status' },
        { status: 500 }
      )
    }

    // Log the status change (optional - could be used for audit trail)
    console.log(`Application ${params.id} status changed from ${existingApplication.status} to ${status} by partner ${partnerProfile.id}`)

    return NextResponse.json({
      application,
      success: true,
      message: `Application status updated to ${status}`,
      previous_status: existingApplication.status
    })

  } catch (error) {
    console.error('Unexpected error in PUT /api/applications/[id]/status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 