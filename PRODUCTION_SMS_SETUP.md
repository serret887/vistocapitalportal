# 🚀 Production SMS Setup Guide

## **SMS Provider Configuration**

### **Option 1: Twilio (Recommended)**

1. **Sign up for Twilio**:

   - Go to [twilio.com](https://twilio.com)
   - Create an account and get your credentials

2. **Get Twilio Credentials**:

   - Account SID
   - Auth Token
   - Message Service SID (create a messaging service)

3. **Set Environment Variables in Supabase**:
   ```
   SUPABASE_AUTH_SMS_TWILIO_ACCOUNT_SID=your_account_sid
   SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=your_auth_token
   SUPABASE_AUTH_SMS_TWILIO_MESSAGE_SERVICE_SID=your_message_service_sid
   ```

### **Option 2: MessageBird**

1. **Sign up for MessageBird**:

   - Go to [messagebird.com](https://messagebird.com)
   - Create an account

2. **Set Environment Variables**:
   ```
   SUPABASE_AUTH_SMS_MESSAGEBIRD_ACCESS_KEY=your_access_key
   ```

### **Option 3: Vonage (formerly Nexmo)**

1. **Sign up for Vonage**:

   - Go to [vonage.com](https://vonage.com)
   - Create an account

2. **Set Environment Variables**:
   ```
   SUPABASE_AUTH_SMS_VONAGE_API_KEY=your_api_key
   SUPABASE_AUTH_SMS_VONAGE_API_SECRET=your_api_secret
   ```

## **Supabase Dashboard Configuration**

1. **Go to Supabase Dashboard**:

   - Navigate to your project
   - Go to **Authentication** → **Providers**

2. **Enable Phone Auth**:

   - Toggle **Phone Auth** to enabled
   - Configure your SMS provider settings

3. **Set SMS Template**:
   - Template: `Your Visto Capital verification code is {{ .Code }}`
   - This will be sent to users during verification

## **Environment Variables for Vercel**

Add these to your Vercel project environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# SMS Provider (choose one)
SUPABASE_AUTH_SMS_TWILIO_ACCOUNT_SID=your_twilio_account_sid
SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=your_twilio_auth_token
SUPABASE_AUTH_SMS_TWILIO_MESSAGE_SERVICE_SID=your_twilio_message_service_sid
```

## **Testing in Production**

1. **Use a real phone number** for testing
2. **Check SMS delivery** in your SMS provider dashboard
3. **Monitor costs** - SMS has per-message charges
4. **Test the full flow** from onboarding to verification

## **Cost Considerations**

- **Twilio**: ~$0.0075 per SMS (US)
- **MessageBird**: ~$0.01 per SMS (US)
- **Vonage**: ~$0.006 per SMS (US)

## **Security Best Practices**

1. **Rate limiting**: Supabase handles this automatically
2. **OTP expiration**: Default is 1 hour
3. **Failed attempts**: Limited to prevent abuse
4. **Phone number validation**: Built into the component

## **Monitoring**

1. **Check SMS delivery logs** in your provider dashboard
2. **Monitor Supabase logs** for authentication events
3. **Track verification success rates**
4. **Set up alerts** for failed SMS deliveries

## **Troubleshooting**

### **Common Issues:**

1. **SMS not delivered**:

   - Check provider credentials
   - Verify phone number format (+1XXXXXXXXXX)
   - Check provider logs

2. **Invalid OTP errors**:

   - Ensure OTP is entered correctly
   - Check if OTP has expired
   - Verify phone number matches

3. **Rate limiting**:
   - Wait before retrying
   - Check provider limits
   - Monitor usage

## **Production Checklist**

- [ ] SMS provider account created
- [ ] Environment variables set in Supabase
- [ ] Phone auth enabled in Supabase dashboard
- [ ] SMS template configured
- [ ] Test with real phone number
- [ ] Monitor costs and usage
- [ ] Set up monitoring and alerts
