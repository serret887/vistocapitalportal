import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/auth'

// POST /api/auth/onboarding - Complete onboarding
export async function POST(request: NextRequest) {
  try {
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const onboardingData = await request.json()

    // Validate required fields
    if (!onboardingData.partner_type || !onboardingData.phone_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const serverSupabase = createServerSupabaseClient()

    // Prepare profile data
    const profileData = {
      user_id: user.id,
      first_name: onboardingData.first_name || user.email?.split('@')[0] || '',
      last_name: onboardingData.last_name || '',
      email: user.email,
      partner_type: onboardingData.partner_type.toLowerCase().replace(' ', '_'),
      phone_number: onboardingData.phone_number,
      monthly_deal_volume: onboardingData.monthly_deal_volume || 0,
      transaction_volume: onboardingData.transaction_volume || 0,
      transaction_types: onboardingData.transaction_types || [],
      license_number: onboardingData.license_number || null,
      license_state: onboardingData.license_state || null,
      onboarded: true,
      updated_at: new Date().toISOString(),
    }

    // Check if partner profile already exists
    const { data: existingProfile, error: checkError } = await serverSupabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let error

    if (checkError && checkError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Error checking existing profile:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing profile' },
        { status: 500 }
      )
    }

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await serverSupabase
        .from('partner_profiles')
        .update(profileData)
        .eq('user_id', user.id)
      error = updateError
    } else {
      // Create new profile
      const { error: insertError } = await serverSupabase
        .from('partner_profiles')
        .insert([{
          ...profileData,
          created_at: new Date().toISOString(),
        }])
      error = insertError
    }

    if (error) {
      console.error('Error saving partner profile:', error)
      return NextResponse.json(
        { error: 'Failed to save partner profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully'
    })

  } catch (error) {
    console.error('Unexpected error in POST /api/auth/onboarding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 