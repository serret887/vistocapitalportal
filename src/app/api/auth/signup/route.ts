import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = createServerSupabaseClient()

    // Create the user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (error) {
      console.error('Signup error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create partner profile with onboarded = false
    const { error: profileError } = await supabase
      .from('partner_profiles')
      .insert([{
        user_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        onboarded: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])

    if (profileError) {
      console.error('Error creating partner profile:', profileError)
      // Don't fail the signup if profile creation fails
      // The user can still sign in and complete onboarding later
    }

    // Return user data (client will need to sign in separately)
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName,
        lastName,
      },
      message: 'User created successfully. Please sign in.',
    })
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 