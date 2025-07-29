import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const { user, error } = await getAuthenticatedUser(request)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Return user data
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: (user as any).user_metadata?.first_name || '',
        lastName: (user as any).user_metadata?.last_name || '',
      },
    })
  } catch (error) {
    console.error('Get current user API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 