import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const { user, error } = await getAuthenticatedUser(request)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // For server-side signout, we just return success
    // The client will clear the token from localStorage
    return NextResponse.json({
      message: 'Signed out successfully',
    })
  } catch (error) {
    console.error('Signout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 