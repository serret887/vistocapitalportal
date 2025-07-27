// Simple test for your Slack webhook
const webhookUrl = 'https://hooks.slack.com/services/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'

async function testWebhook() {
  console.log('🔗 Testing your Slack webhook...')
  console.log('Webhook URL:', webhookUrl)
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: '🎉 Hello from Visto Capital Partner Portal! Your webhook is working!'
      })
    })

    console.log('Response status:', response.status)
    console.log('Response status text:', response.statusText)

    if (response.ok) {
      console.log('✅ Webhook test successful! Check your Slack channel.')
    } else {
      const errorText = await response.text()
      console.log('❌ Webhook test failed:', errorText)
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message)
  }
}

testWebhook() 