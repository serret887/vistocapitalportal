import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { LoanApplicationStatus } from '@/types'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/applications/[id] - Get a specific application
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get the specific application
    const { data: application, error: applicationError } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('id', params.id)
      .eq('partner_id', partnerProfile.id)
      .single()

    if (applicationError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      application,
      success: true
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/applications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/applications/[id] - Update an application
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
    const updateData = await request.json()

    // Validate the application exists and belongs to this partner
    const { data: existingApplication, error: existingError } = await supabase
      .from('loan_applications')
      .select('id')
      .eq('id', params.id)
      .eq('partner_id', partnerProfile.id)
      .single()

    if (existingError || !existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Update the application
    const { data: application, error: updateError } = await supabase
      .from('loan_applications')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('partner_id', partnerProfile.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      application,
      success: true,
      message: 'Application updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in PUT /api/applications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/applications/[id] - Delete an application
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Validate the application exists and belongs to this partner
    const { data: existingApplication, error: existingError } = await supabase
      .from('loan_applications')
      .select('id, income_documents, bank_statements')
      .eq('id', params.id)
      .eq('partner_id', partnerProfile.id)
      .single()

    if (existingError || !existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // TODO: Delete associated files from storage
    // This would involve deleting files referenced in income_documents and bank_statements

    // Delete the application
    const { error: deleteError } = await supabase
      .from('loan_applications')
      .delete()
      .eq('id', params.id)
      .eq('partner_id', partnerProfile.id)

    if (deleteError) {
      console.error('Error deleting application:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in DELETE /api/applications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 