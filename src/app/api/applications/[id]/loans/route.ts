import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUserFromRequest } from '@/lib/auth'
// import { sendLoanNotification } from '@/lib/slack-notifications'

// GET /api/applications/[id]/loans - Get all loans for an application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { user, error: userError } = await getCurrentUserFromRequest(request)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: applicationId } = await params

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

    // Get all loans for this application
    const { data: loans, error } = await supabase
      .from('loans')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching loans:', error)
      return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
    }

    return NextResponse.json({ loans: loans || [] })
  } catch (error) {
    console.error('Error in GET /api/applications/[id]/loans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/applications/[id]/loans - Create a new loan for an application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { user, error: userError } = await getCurrentUserFromRequest(request)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: applicationId } = await params
    const loanData = await request.json()

    // First verify the application belongs to the current user
    const { data: application, error: appError } = await supabase
      .from('loan_applications')
      .select('id, partner_id, first_name, last_name, email, property_address')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Get partner_id for the current user
    const { data: partnerProfile } = await supabase
      .from('partner_profiles')
      .select('id, first_name, last_name, email, phone_number, company_name')
      .eq('user_id', user.id)
      .single()

    if (!partnerProfile || application.partner_id !== partnerProfile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Create the new loan
    const { data: loan, error } = await supabase
      .from('loans')
      .insert({
        application_id: applicationId,
        ...loanData
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating loan:', error)
      return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 })
    }

    // Send Slack notification
    try {
      // await sendLoanNotification(loan, application, partnerProfile)
    } catch (notificationError) {
      console.error('Failed to send Slack notification:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ loan })
  } catch (error) {
    console.error('Error in POST /api/applications/[id]/loans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 