// Test script to verify onboarding submission includes required fields
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testOnboardingSubmission() {
  console.log('Testing onboarding submission with required fields...')

  try {
    // Get a test user
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('Error listing users:', userError)
      return
    }

    const testUser = users.users[0]
    if (!testUser) {
      console.error('No users found for testing')
      return
    }

    console.log('Test user:', testUser.id)
    console.log('User metadata:', testUser.user_metadata)

    // Check if user already has a partner profile
    const { data: existingProfile, error: profileError } = await supabase
      .from('partner_profiles')
      .select('*')
      .eq('user_id', testUser.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', profileError)
      return
    }

    if (existingProfile) {
      console.log('User already has a profile, testing update...')
      
      // Test updating the profile with onboarding data
      const updateData = {
        user_id: testUser.id,
        first_name: testUser.user_metadata?.first_name || 'Test',
        last_name: testUser.user_metadata?.last_name || 'User',
        email: testUser.email,
        partner_type: 'wholesaler',
        phone_number: '+15551234567',
        monthly_deal_volume: 5,
        transaction_volume: 750000,
        transaction_types: ['Fix and Flip', 'Long Term Rental'],
        license_number: null,
        license_state: null,
        onboarded: true,
        updated_at: new Date().toISOString(),
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('partner_profiles')
        .update(updateData)
        .eq('user_id', testUser.id)
        .select()

      if (updateError) {
        console.error('Error updating profile:', updateError)
      } else {
        console.log('Successfully updated profile:', updatedProfile)
      }
    } else {
      console.log('User has no profile, testing creation...')
      
      // Test creating a new profile with onboarding data
      const createData = {
        user_id: testUser.id,
        first_name: testUser.user_metadata?.first_name || 'Test',
        last_name: testUser.user_metadata?.last_name || 'User',
        email: testUser.email,
        partner_type: 'wholesaler',
        phone_number: '+15551234567',
        monthly_deal_volume: 5,
        transaction_volume: 750000,
        transaction_types: ['Fix and Flip', 'Long Term Rental'],
        license_number: null,
        license_state: null,
        onboarded: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: newProfile, error: createError } = await supabase
        .from('partner_profiles')
        .insert([createData])
        .select()

      if (createError) {
        console.error('Error creating profile:', createError)
      } else {
        console.log('Successfully created profile:', newProfile)
      }
    }

  } catch (error) {
    console.error('Test failed:', error)
  }
}

testOnboardingSubmission() 