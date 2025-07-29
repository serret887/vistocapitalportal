import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/auth'

// GET /api/auth/profile/[userId] - Get partner profile for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { userId } = await params

    // Users can only access their own profile
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const serverSupabase = createServerSupabaseClient()

    // Get partner profile
    const { data: partnerProfile, error: partnerError } = await serverSupabase
      .from('partner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (partnerError) {
      // If no profile found, return null (not an error)
      if (partnerError.code === 'PGRST116') {
        return NextResponse.json({
          profile: null,
          success: true
        })
      }
      
      console.error('Error fetching partner profile:', partnerError)
      return NextResponse.json(
        { error: 'Failed to fetch partner profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profile: partnerProfile,
      success: true
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/auth/profile/[userId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 