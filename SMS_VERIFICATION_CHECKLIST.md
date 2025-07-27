# 📱 SMS Verification Testing Checklist

## **🧪 Local Development Testing**

### **Step 1: Start Local Supabase**

```bash
supabase start
```

### **Step 2: Test Basic Functionality**

1. **Visit test page**: `http://localhost:3000/test-sms`
2. **Test with phone number**: `5551234567`
3. **Send OTP**: Click "Send Test OTP"
4. **Enter OTP**: `123456`
5. **Verify**: Click "Verify OTP"
6. **Check console**: Look for success/error logs

### **Step 3: Test Error Scenarios**

- [ ] **Invalid phone number**: Try `1234567890`
- [ ] **Invalid OTP**: Try `000000`
- [ ] **Rate limiting**: Send multiple OTPs quickly
- [ ] **Network errors**: Disconnect internet temporarily

### **Step 4: Test Onboarding Integration**

1. **Go to onboarding**: `http://localhost:3000/onboarding`
2. **Complete step 1**: Partner type
3. **Enter phone number**: Use test number `5551234567`
4. **Click "Verify Phone Number"**
5. **Enter OTP**: `123456`
6. **Verify**: Should proceed to next step

## **🚀 Production Testing**

### **Step 1: Configure SMS Provider**

1. **Sign up for Twilio/MessageBird/Vonage**
2. **Get API credentials**
3. **Set environment variables in Supabase**
4. **Enable Phone Auth in Supabase dashboard**

### **Step 2: Test with Real Phone Numbers**

- [ ] **Use your actual phone number**
- [ ] **Send OTP**: Should receive SMS
- [ ] **Enter received OTP**: Should verify successfully
- [ ] **Check provider dashboard**: Verify SMS delivery

### **Step 3: Test Production Onboarding**

1. **Deploy to Vercel**
2. **Test onboarding flow**: Use real phone number
3. **Verify SMS delivery**: Check provider logs
4. **Test verification**: Enter received OTP

## **🔍 Debugging Steps**

### **Common Issues & Solutions**

#### **Issue: "Failed to send OTP"**

**Solutions:**

- Check Supabase environment variables
- Verify SMS provider credentials
- Check phone number format (+1XXXXXXXXXX)
- Review Supabase logs

#### **Issue: "Invalid OTP"**

**Solutions:**

- Ensure OTP is entered correctly
- Check if OTP has expired (1 hour limit)
- Verify phone number matches
- Try resending OTP

#### **Issue: "Rate limit exceeded"**

**Solutions:**

- Wait 5-10 minutes before retrying
- Check provider rate limits
- Monitor usage in provider dashboard

#### **Issue: "SMS not delivered"**

**Solutions:**

- Check provider account status
- Verify phone number is valid
- Check provider delivery logs
- Test with different phone number

## **📊 Monitoring & Logs**

### **Supabase Logs**

1. **Go to Supabase Dashboard** → **Logs**
2. **Filter by**: `auth` events
3. **Look for**: `signInWithOtp` and `verifyOtp` events

### **Provider Dashboard**

1. **Check SMS delivery status**
2. **Monitor costs and usage**
3. **Review failed deliveries**
4. **Set up alerts for failures**

### **Browser Console**

1. **Open Developer Tools** → **Console**
2. **Look for**: API call logs
3. **Check for**: Error messages
4. **Verify**: Response data

## **✅ Success Criteria**

### **Local Development**

- [ ] Test OTP sends successfully
- [ ] Test OTP verifies correctly
- [ ] Error handling works properly
- [ ] Onboarding integration functions
- [ ] Console logs are informative

### **Production**

- [ ] Real SMS delivers to phone
- [ ] OTP verification works with real code
- [ ] Rate limiting prevents abuse
- [ ] Error messages are user-friendly
- [ ] Costs are reasonable and monitored

## **🚨 Emergency Procedures**

### **If SMS Provider Fails**

1. **Check provider status page**
2. **Contact provider support**
3. **Consider backup provider**
4. **Temporarily disable phone verification**

### **If Supabase Auth Issues**

1. **Check Supabase status**
2. **Review environment variables**
3. **Test with different credentials**
4. **Contact Supabase support**

## **📈 Performance Monitoring**

### **Metrics to Track**

- [ ] **SMS delivery rate**: Should be >95%
- [ ] **Verification success rate**: Should be >90%
- [ ] **Average response time**: Should be <5 seconds
- [ ] **Cost per verification**: Should be <$0.01

### **Alerts to Set Up**

- [ ] **SMS delivery failures**: >5% failure rate
- [ ] **High costs**: >$10/day
- [ ] **Rate limit warnings**: >80% of limit
- [ ] **Provider downtime**: Any provider issues

## **🔄 Continuous Testing**

### **Automated Tests**

- [ ] **Unit tests**: Test component functions
- [ ] **Integration tests**: Test API calls
- [ ] **E2E tests**: Test full user flow
- [ ] **Load tests**: Test rate limiting

### **Manual Testing Schedule**

- [ ] **Daily**: Test with development numbers
- [ ] **Weekly**: Test with production numbers
- [ ] **Monthly**: Review costs and performance
- [ ] **Quarterly**: Update provider settings
