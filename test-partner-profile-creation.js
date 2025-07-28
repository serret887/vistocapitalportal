// Test script to debug partner profile creation issue
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPartnerProfileCreation() {
  console.log('Testing partner profile creation...')

  try {
    // Check if there are any partner profiles
    const { data: profiles, error: profileError } = await supabase
      .from('partner_profiles')
      .select('*')

    if (profileError) {
      console.error('Error checking partner profiles:', profileError)
    } else {
      console.log('Total partner profiles:', profiles.length)
      if (profiles.length > 0) {
        console.log('Sample profiles:')
        profiles.slice(0, 3).forEach(profile => {
          console.log(`  Profile ID: ${profile.id}`)
          console.log(`  User ID: ${profile.user_id}`)
          console.log(`  First Name: ${profile.first_name}`)
          console.log(`  Last Name: ${profile.last_name}`)
          console.log(`  Email: ${profile.email}`)
          console.log(`  Onboarded: ${profile.onboarded}`)
          console.log('  ---')
        })
      }
    }

    // Check recent auth users to see their metadata
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()

    if (userError) {
      console.error('Error listing users:', userError)
    } else {
      console.log('Recent users:')
      users.users.slice(0, 3).forEach(user => {
        console.log(`  User: ${user.id}`)
        console.log(`    Email: ${user.email}`)
        console.log(`    Metadata:`, user.user_metadata)
        
        // Check if this user has a partner profile
        const hasProfile = profiles?.some(p => p.user_id === user.id)
        console.log(`    Has partner profile: ${hasProfile}`)
        console.log('  ---')
      })
    }

    // Test creating a partner profile manually
    console.log('\nTesting manual partner profile creation...')
    const testUserId = users.users[0]?.id
    if (testUserId) {
      const testUser = users.users.find(u => u.id === testUserId)
      console.log(`Creating profile for user: ${testUserId}`)
      console.log(`User metadata:`, testUser.user_metadata)
      
      const { data: newProfile, error: createError } = await supabase
        .from('partner_profiles')
        .insert({
          user_id: testUserId,
          first_name: testUser.user_metadata?.first_name || 'Test',
          last_name: testUser.user_metadata?.last_name || 'User',
          email: testUser.email,
          partner_type: 'wholesaler',
          onboarded: false
        })
        .select()

      if (createError) {
        console.error('Error creating test profile:', createError)
      } else {
        console.log('Successfully created test profile:', newProfile)
      }
    }

  } catch (error) {
    console.error('Test failed:', error)
  }
}

testPartnerProfileCreation() 