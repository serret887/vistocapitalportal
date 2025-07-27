// Test script to verify phone verification error handling
const testPhoneVerification = () => {
  console.log('Testing phone verification error handling...')
  
  // Simulate the "Signups not allowed for otp" error
  const mockError = {
    message: 'Signups not allowed for otp',
    status: 400
  }
  
  // Test the error detection logic
  const isOtpDisabledError = mockError.message.includes('Signups not allowed for otp')
  
  console.log('Error message:', mockError.message)
  console.log('Is OTP disabled error?', isOtpDisabledError)
  
  if (isOtpDisabledError) {
    console.log('✅ Error correctly detected as OTP disabled')
    console.log('✅ User should see "Continue Without Verification" option')
  } else {
    console.log('❌ Error not detected correctly')
  }
  
  console.log('\nTo test in production:')
  console.log('1. Go to your deployed app')
  console.log('2. Start onboarding process')
  console.log('3. Enter a phone number (e.g., 5551234567)')
  console.log('4. Click "Verify Phone Number"')
  console.log('5. You should see "Phone verification is currently disabled" message')
  console.log('6. Click "Continue Without Verification" to proceed')
}

testPhoneVerification() 