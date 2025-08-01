import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getAuthenticatedUser } from '@/lib/auth'

// GET /api/applications/[id]/loans/[loanId] - Get a specific loan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; loanId: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: applicationId, loanId } = await params

    // First verify the application belongs to the current user
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, user_id')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Verify the application belongs to the current user
    if (application.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get the specific loan
    const { data: loan, error } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .eq('application_id', applicationId)
      .single()

    if (error || !loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    return NextResponse.json({ loan })
  } catch (error) {
    console.error('Error in GET /api/applications/[id]/loans/[loanId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/applications/[id]/loans/[loanId] - Update a specific loan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; loanId: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: applicationId, loanId } = await params
    const updateData = await request.json()

    // First verify the application belongs to the current user
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, user_id')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Verify the application belongs to the current user
    if (application.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the loan
    const { data: loan, error } = await supabase
      .from('loans')
      .update(updateData)
      .eq('id', loanId)
      .eq('application_id', applicationId)
      .select()
      .single()

    if (error || !loan) {
      return NextResponse.json({ error: 'Failed to update loan' }, { status: 500 })
    }

    return NextResponse.json({ loan })
  } catch (error) {
    console.error('Error in PUT /api/applications/[id]/loans/[loanId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/applications/[id]/loans/[loanId] - Delete a specific loan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; loanId: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: applicationId, loanId } = await params

    // First verify the application belongs to the current user
    const { data: application, error: appError } = await supabase
      .from('loan_applications')
      .select('id, partner_id')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Get partner_id for the current user
    const { data: partnerProfile } = await supabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!partnerProfile || application.partner_id !== partnerProfile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the loan from loans table
    const { error: loanError } = await supabase
      .from('loans')
      .delete()
      .eq('id', loanId)
      .eq('application_id', applicationId)

    if (loanError) {
      console.error('Error deleting loan:', loanError)
      return NextResponse.json({ error: 'Failed to delete loan' }, { status: 500 })
    }

    // Delete the application from loan_applications table
    const { error: appDeleteError } = await supabase
      .from('loan_applications')
      .delete()
      .eq('id', applicationId)

    if (appDeleteError) {
      console.error('Error deleting application:', appDeleteError)
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/applications/[id]/loans/[loanId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 