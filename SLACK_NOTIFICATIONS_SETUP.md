# Slack Notifications Setup

This document explains how to set up Slack notifications for the Visto Capital Partner Portal.

## Overview

The application now sends Slack notifications when:

- A new loan application is submitted
- A new loan is created

## Setup Instructions

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app (e.g., "Visto Capital Partner Portal")
4. Select your workspace

### 2. Configure Incoming Webhooks

1. In your Slack app settings, go to "Incoming Webhooks"
2. Toggle "Activate Incoming Webhooks" to On
3. Click "Add New Webhook to Workspace"
4. Select the channel where you want notifications (e.g., #visto-notifications)
5. Click "Allow"
6. Copy the Webhook URL (starts with `https://hooks.slack.com/services/...`)

### 3. Set Environment Variable

Add the webhook URL to your environment variables:

#### For Development (.env.local):

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### For Production (Vercel):

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add:
   - **Name**: `SLACK_WEBHOOK_URL`
   - **Value**: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`
   - **Environment**: Production (and Preview if desired)

### 4. Test the Setup

Run the test script to verify notifications work:

```bash
node test-slack-notification.js
```

## Notification Types

### Application Notifications

- **Trigger**: When a partner submits a new loan application
- **Information**: Partner details, borrower info, property details, DSCR score
- **Color**: Green (#36a64f)

### Loan Notifications

- **Trigger**: When a partner creates a new loan
- **Information**: Partner details, loan amount, property details, borrower info
- **Color**: Red (#ff6b6b)

## Message Format

### Application Notifications Include:

- **🤝 Partner Information**: Name, email, phone, company
- **👤 Borrower Information**: Name, email, phone, SSN, DOB, income, assets, income sources, bank accounts
- **🏠 Property Information**: Address, city, state, ZIP, county, type, year built, square footage, bedrooms, bathrooms, lot size, purchase price, appraisal value, estimated value
- **💰 Loan Information**: Type, amount, down payment, rental income, insurance, taxes, HOA fees, FICO score, prepayment penalty, discount points, broker details, DSCR score, status, application ID

### Loan Notifications Include:

- **🤝 Partner Information**: Name, email, phone, company
- **👤 Borrower Information**: Name, email, phone
- **🏠 Property Information**: Address, city, state, ZIP
- **💰 Loan Information**: Loan ID, application ID, amount, type

## Troubleshooting

### Notifications not sending?

1. Check that `SLACK_WEBHOOK_URL` is set correctly
2. Verify the webhook URL is valid and active
3. Check server logs for error messages
4. Test with the provided test script

### Webhook URL format

- Should start with: `https://hooks.slack.com/services/`
- Should be a complete URL with your unique token

### Channel permissions

- Make sure the Slack app has permission to post to the selected channel
- The channel should be public or the app should be added to private channels

## Security Notes

- Keep your webhook URL secure and don't commit it to version control
- The webhook URL provides full access to post to your Slack workspace
- Consider using different webhooks for development and production environments

## Customization

To modify notification content or add new notification types:

1. Edit `src/lib/slack-notifications.ts`
2. Add new notification functions as needed
3. Import and use in the appropriate API routes

## Example Notification

```
📋 New Loan Application Submitted

🤝 Partner Information
*Name:* John Doe
*Email:* john@example.com
*Phone:* 555-123-4567
*Company:* Visto Capital Partners

👤 Borrower Information
*Name:* Jane Smith
*Email:* jane@example.com
*Phone:* 555-987-6543
*DOB:* 1985-03-15
*Income:* $85,000
*Assets:* $150,000
*Bank Accounts:* 3
*Income Sources:* Employment, Rental Income

🏠 Property Information
*Address:* 123 Main St, Anytown, USA
*City:* Anytown
*State:* FL
*ZIP:* 33101
*County:* Miami-Dade
*Type:* Single Family
*Year Built:* 2010
*Square Feet:* 2,500
*Bedrooms:* 3
*Bathrooms:* 2
*Lot Size:* 0.25 acres
*Purchase Price:* $350,000
*Appraisal Value:* $375,000
*Estimated Value:* $375,000

💰 Loan Information
*Type:* DSCR
*Amount:* $280,000
*Down Payment:* 20%
*Monthly Rental Income:* $2,500
*Annual Insurance:* $1,200
*Annual Taxes:* $2,400
*Monthly HOA:* $0
*FICO Score:* 740-759
*Prepayment Penalty:* 5/4/3/2/1
*Discount Points:* 0
*Broker Points:* 1
*Broker Admin Fee:* $995
*Broker YSP:* 1
*DSCR Score:* 1.25
*Status:* In Review
*Application ID:* app_123
```
