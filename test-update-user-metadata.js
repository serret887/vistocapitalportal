// Test script to update user metadata to match dashboard display
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateUserMetadata() {
  console.log('Updating user metadata to match dashboard display...')

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

    console.log('Current user metadata:')
    console.log(`  User ID: ${targetUser.id}`)
    console.log(`  Email: ${targetUser.email}`)
    console.log(`  Current first_name: ${targetUser.user_metadata?.first_name}`)
    console.log(`  Current last_name: ${targetUser.user_metadata?.last_name}`)
    console.log(`  Raw metadata:`, targetUser.user_metadata)

    // Update the user metadata to match the dashboard display
    const updatedMetadata = {
      ...targetUser.user_metadata,
      first_name: 'asdfas',
      last_name: 'serret',
      full_name: 'asdfas serret'
    }

    console.log('Updating user metadata...')
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      {
        user_metadata: updatedMetadata
      }
    )

    if (updateError) {
      console.error('Error updating user metadata:', updateError)
    } else {
      console.log('Successfully updated user metadata:')
      console.log(`  New first_name: ${updatedUser.user.user_metadata?.first_name}`)
      console.log(`  New last_name: ${updatedUser.user.user_metadata?.last_name}`)
      console.log(`  New full_name: ${updatedUser.user.user_metadata?.full_name}`)
    }

    // Now test updating the partner profile with the corrected metadata
    console.log('\nTesting partner profile update with corrected metadata...')
    
    const profileData = {
      user_id: targetUser.id,
      first_name: 'asdfas',
      last_name: 'serret',
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

    const { data: updatedProfile, error: profileError } = await supabase
      .from('partner_profiles')
      .update(profileData)
      .eq('user_id', targetUser.id)
      .select()

    if (profileError) {
      console.error('Error updating partner profile:', profileError)
    } else {
      console.log('Successfully updated partner profile:')
      console.log(`  Profile ID: ${updatedProfile[0].id}`)
      console.log(`  First Name: ${updatedProfile[0].first_name}`)
      console.log(`  Last Name: ${updatedProfile[0].last_name}`)
      console.log(`  Email: ${updatedProfile[0].email}`)
      console.log(`  Onboarded: ${updatedProfile[0].onboarded}`)
    }

  } catch (error) {
    console.error('Test failed:', error)
  }
}

updateUserMetadata() 