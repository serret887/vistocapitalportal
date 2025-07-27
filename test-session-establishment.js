// Test script to verify session establishment after signup
const testSessionEstablishment = () => {
  console.log('Testing session establishment logic...')
  
  // Mock the waitForSession function
  const waitForSession = async (maxAttempts = 10) => {
    for (let i = 0; i < maxAttempts; i++) {
      // Simulate checking for user session
      const hasSession = Math.random() > 0.7 // 30% chance of success each attempt
      if (hasSession) {
        console.log(`✅ Session established on attempt ${i + 1}`)
        return true
      }
      console.log(`⏳ Session attempt ${i + 1}/${maxAttempts} - waiting...`)
      await new Promise(resolve => setTimeout(resolve, 100)) // Faster for testing
    }
    console.log('❌ Session establishment failed after all attempts')
    return false
  }
  
  const testSignupFlow = async () => {
    console.log('\n🧪 Testing signup flow:')
    console.log('1. User submits signup form')
    console.log('2. Account created successfully')
    console.log('3. Waiting for session establishment...')
    
    const sessionEstablished = await waitForSession()
    
    if (sessionEstablished) {
      console.log('4. ✅ Session established! Redirecting to onboarding...')
      console.log('5. User should now see onboarding page')
    } else {
      console.log('4. ❌ Session setup failed. Redirecting to login...')
      console.log('5. User should try logging in manually')
    }
  }
  
  testSignupFlow()
  
  console.log('\n📋 To test in the app:')
  console.log('1. Go to http://localhost:3001/signup')
  console.log('2. Fill out the signup form')
  console.log('3. Submit and watch the console for session establishment')
  console.log('4. Should redirect to /onboarding after successful session')
}

testSessionEstablishment() 