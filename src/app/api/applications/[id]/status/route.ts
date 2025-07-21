import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { LoanApplicationStatus } from '@/types'

interface RouteParams {
  params: { id: string }
}

// PUT /api/applications/[id]/status - Update application status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error: userError } = await getCurrentUserFromRequest(request)
    
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

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update the application status
    const { error } = await supabase
      .from('loan_applications')
      .update({ status })
      .eq('id', params.id)
      .eq('partner_id', partnerProfile.id)

    if (error) {
      console.error('Error updating application status:', error)
      return NextResponse.json(
        { error: 'Failed to update application status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Application status updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in PUT /api/applications/[id]/status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 