# Environment Variables Setup

This document lists all required environment variables for the Visto Capital Partner Portal.

## Required Environment Variables

### Supabase Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Slack Notifications (NEW)

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### SMS Configuration (for phone verification)

```bash
SUPABASE_AUTH_SMS_TWILIO_ACCOUNT_SID=your_twilio_account_sid
SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=your_twilio_auth_token
SUPABASE_AUTH_SMS_TWILIO_MESSAGE_SERVICE_SID=your_twilio_message_service_sid
```

## Setup Instructions

### 1. Development (.env.local)

Create a `.env.local` file in the project root with all the variables above.

### 2. Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the appropriate values
4. Set environment to "Production" (and "Preview" if desired)

## Slack Webhook Setup

To get your Slack webhook URL:

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app or use existing one
3. Go to "Incoming Webhooks"
4. Activate webhooks and create a new webhook
5. Select your channel and copy the webhook URL
6. Add to environment variables as `SLACK_WEBHOOK_URL`

## Testing

Run the test script to verify Slack notifications work:

```bash
node test-slack-notification.js
```

## Security Notes

- Never commit environment variables to version control
- Use different webhook URLs for development and production
- Keep your Supabase service role key secure
- Rotate keys regularly for security
