// Test script to check the specific user causing the issue
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSpecificUser() {
  console.log('Testing specific user: serret887@gmail.com')

  try {
    // Find the user with email serret887@gmail.com
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('Error listing users:', userError)
      return
    }

    const targetUser = users.users.find(u => u.email === 'serret887@gmail.com')
    
    if (!targetUser) {
      console.log('User with email serret887@gmail.com not found')
      return
    }

    console.log('Found target user:')
    console.log(`  User ID: ${targetUser.id}`)
    console.log(`  Email: ${targetUser.email}`)
    console.log(`  Display Name: ${targetUser.user_metadata?.full_name || 'N/A'}`)
    console.log(`  First Name: ${targetUser.user_metadata?.first_name || 'N/A'}`)
    console.log(`  Last Name: ${targetUser.user_metadata?.last_name || 'N/A'}`)
    console.log(`  Raw Metadata:`, targetUser.user_metadata)
    console.log(`  Raw User Meta Data:`, targetUser.raw_user_meta_data)

    // Check if this user has a partner profile
    const { data: profile, error: profileError } = await supabase
      .from('partner_profiles')
      .select('*')
      .eq('user_id', targetUser.id)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log('No partner profile found for this user')
      } else {
        console.error('Error checking partner profile:', profileError)
      }
    } else {
      console.log('Partner profile found:')
      console.log(`  Profile ID: ${profile.id}`)
      console.log(`  First Name: ${profile.first_name}`)
      console.log(`  Last Name: ${profile.last_name}`)
      console.log(`  Email: ${profile.email}`)
      console.log(`  Onboarded: ${profile.onboarded}`)
    }

    // Test creating/updating the profile with correct data
    const profileData = {
      user_id: targetUser.id,
      first_name: targetUser.user_metadata?.first_name || 'asdfas',
      last_name: targetUser.user_metadata?.last_name || 'serret',
      email: targetUser.email,
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

    if (profile) {
      console.log('Updating existing profile...')
      const { data: updatedProfile, error: updateError } = await supabase
        .from('partner_profiles')
        .update(profileData)
        .eq('user_id', targetUser.id)
        .select()

      if (updateError) {
        console.error('Error updating profile:', updateError)
      } else {
        console.log('Successfully updated profile:', updatedProfile)
      }
    } else {
      console.log('Creating new profile...')
      const { data: newProfile, error: createError } = await supabase
        .from('partner_profiles')
        .insert([{
          ...profileData,
          created_at: new Date().toISOString(),
        }])
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

testSpecificUser() 