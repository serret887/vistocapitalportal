// Test script for Slack notifications with proper environment loading
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envLines = envContent.split('\n')
    
    envLines.forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '')
          process.env[key] = value
        }
      }
    })
  }
}

// Load environment variables
loadEnv()

async function sendSlackNotification(data) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  
  console.log('Webhook URL found:', webhookUrl ? 'YES' : 'NO')
  
  if (!webhookUrl) {
    console.log('Slack webhook URL not configured, skipping notification')
    return
  }

  try {
    const { type, partnerName, partnerEmail, partnerPhone, partnerCompany, applicationId, loanId, loanAmount, propertyAddress, borrowerName, borrowerEmail, borrowerPhone, borrowerSSN, borrowerDOB, borrowerIncome, borrowerAssets, borrowerIncomeSources, borrowerBankAccounts, status, dscrScore, loanType, propertyType, propertyDetails, loanDetails } = data

    let title = ''
    let color = '#36a64f' // Green
    let fields = []

    if (type === 'application') {
      title = '📋 New Loan Application Submitted'

      // Partner Information
      fields.push({
        title: '🤝 Partner Information',
        value: `*Name:* ${partnerName}\n*Email:* ${partnerEmail}${partnerPhone ? `\n*Phone:* ${partnerPhone}` : ''}${partnerCompany ? `\n*Company:* ${partnerCompany}` : ''}`,
        short: false
      })

      // Borrower Information
      const borrowerInfo = [
        `*Name:* ${borrowerName || 'N/A'}`,
        `*Email:* ${borrowerEmail || 'N/A'}`,
        borrowerPhone ? `*Phone:* ${borrowerPhone}` : null,
        borrowerDOB ? `*DOB:* ${borrowerDOB}` : null,
        borrowerSSN ? `*SSN:* ${borrowerSSN}` : null,
        borrowerIncome ? `*Income:* $${borrowerIncome.toLocaleString()}` : null,
        borrowerAssets ? `*Assets:* $${borrowerAssets.toLocaleString()}` : null,
        borrowerBankAccounts ? `*Bank Accounts:* ${borrowerBankAccounts}` : null,
        borrowerIncomeSources ? `*Income Sources:* ${borrowerIncomeSources.join(', ')}` : null
      ].filter(Boolean).join('\n')

      fields.push({
        title: '👤 Borrower Information',
        value: borrowerInfo,
        short: false
      })

      // Property Information
      const propertyInfo = [
        `*Address:* ${propertyAddress || 'TBD'}`,
        propertyDetails?.city ? `*City:* ${propertyDetails.city}` : null,
        propertyDetails?.state ? `*State:* ${propertyDetails.state}` : null,
        propertyDetails?.zipCode ? `*ZIP:* ${propertyDetails.zipCode}` : null,
        propertyDetails?.county ? `*County:* ${propertyDetails.county}` : null,
        propertyType ? `*Type:* ${propertyType}` : null,
        propertyDetails?.yearBuilt ? `*Year Built:* ${propertyDetails.yearBuilt}` : null,
        propertyDetails?.squareFootage ? `*Square Feet:* ${propertyDetails.squareFootage.toLocaleString()}` : null,
        propertyDetails?.bedrooms ? `*Bedrooms:* ${propertyDetails.bedrooms}` : null,
        propertyDetails?.bathrooms ? `*Bathrooms:* ${propertyDetails.bathrooms}` : null,
        propertyDetails?.lotSize ? `*Lot Size:* ${propertyDetails.lotSize}` : null,
        propertyDetails?.purchasePrice ? `*Purchase Price:* $${propertyDetails.purchasePrice.toLocaleString()}` : null,
        propertyDetails?.appraisalValue ? `*Appraisal Value:* $${propertyDetails.appraisalValue.toLocaleString()}` : null,
        propertyDetails?.estimatedValue ? `*Estimated Value:* $${propertyDetails.estimatedValue.toLocaleString()}` : null
      ].filter(Boolean).join('\n')

      fields.push({
        title: '🏠 Property Information',
        value: propertyInfo,
        short: false
      })

      // Loan Information
      const loanInfo = [
        `*Type:* ${loanType || 'N/A'}`,
        loanAmount ? `*Amount:* $${loanAmount.toLocaleString()}` : null,
        loanDetails?.downPaymentPercentage ? `*Down Payment:* ${loanDetails.downPaymentPercentage}%` : null,
        loanDetails?.monthlyRentalIncome ? `*Monthly Rental Income:* $${loanDetails.monthlyRentalIncome.toLocaleString()}` : null,
        loanDetails?.annualInsurance ? `*Annual Insurance:* $${loanDetails.annualInsurance.toLocaleString()}` : null,
        loanDetails?.annualTaxes ? `*Annual Taxes:* $${loanDetails.annualTaxes.toLocaleString()}` : null,
        loanDetails?.monthlyHoaFee ? `*Monthly HOA:* $${loanDetails.monthlyHoaFee.toLocaleString()}` : null,
        loanDetails?.ficoScore ? `*FICO Score:* ${loanDetails.ficoScore}` : null,
        loanDetails?.prepaymentPenalty ? `*Prepayment Penalty:* ${loanDetails.prepaymentPenalty}` : null,
        loanDetails?.discountPoints ? `*Discount Points:* ${loanDetails.discountPoints}` : null,
        loanDetails?.brokerPoints ? `*Broker Points:* ${loanDetails.brokerPoints}` : null,
        loanDetails?.brokerAdminFee ? `*Broker Admin Fee:* $${loanDetails.brokerAdminFee.toLocaleString()}` : null,
        loanDetails?.brokerYSP ? `*Broker YSP:* ${loanDetails.brokerYSP}` : null,
        dscrScore ? `*DSCR Score:* ${dscrScore}` : null,
        `*Status:* ${status || 'In Review'}`,
        `*Application ID:* ${applicationId || 'N/A'}`
      ].filter(Boolean).join('\n')

      fields.push({
        title: '💰 Loan Information',
        value: loanInfo,
        short: false
      })

    } else if (type === 'loan') {
      title = '💰 New Loan Created'
      color = '#ff6b6b' // Red

      // Partner Information
      fields.push({
        title: '🤝 Partner Information',
        value: `*Name:* ${partnerName}\n*Email:* ${partnerEmail}${partnerPhone ? `\n*Phone:* ${partnerPhone}` : ''}${partnerCompany ? `\n*Company:* ${partnerCompany}` : ''}`,
        short: false
      })

      // Borrower Information
      const borrowerInfo = [
        `*Name:* ${borrowerName || 'N/A'}`,
        `*Email:* ${borrowerEmail || 'N/A'}`,
        borrowerPhone ? `*Phone:* ${borrowerPhone}` : null
      ].filter(Boolean).join('\n')

      fields.push({
        title: '👤 Borrower Information',
        value: borrowerInfo,
        short: false
      })

      // Property Information
      const propertyInfo = [
        `*Address:* ${propertyAddress || 'N/A'}`,
        propertyDetails?.city ? `*City:* ${propertyDetails.city}` : null,
        propertyDetails?.state ? `*State:* ${propertyDetails.state}` : null,
        propertyDetails?.zipCode ? `*ZIP:* ${propertyDetails.zipCode}` : null
      ].filter(Boolean).join('\n')

      fields.push({
        title: '🏠 Property Information',
        value: propertyInfo,
        short: false
      })

      // Loan Information
      const loanInfo = [
        `*Loan ID:* ${loanId || 'N/A'}`,
        `*Application ID:* ${applicationId || 'N/A'}`,
        loanAmount ? `*Amount:* $${loanAmount.toLocaleString()}` : null,
        loanType ? `*Type:* ${loanType}` : null
      ].filter(Boolean).join('\n')

      fields.push({
        title: '💰 Loan Information',
        value: loanInfo,
        short: false
      })
    }

    const payload = {
      attachments: [
        {
          color,
          title,
          fields,
          footer: 'Visto Capital Partner Portal',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('Failed to send Slack notification:', response.statusText)
    } else {
      console.log('Slack notification sent successfully')
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error)
  }
}

async function testSlackNotification() {
  console.log('Testing Slack notification with environment variables...')
  
  // Test application notification
  const applicationData = {
    type: 'application',
    partnerName: 'John Doe',
    partnerEmail: 'john@example.com',
    partnerPhone: '555-123-4567',
    partnerCompany: 'Visto Capital Partners',
    applicationId: 'app_123',
    borrowerName: 'Jane Smith',
    borrowerEmail: 'jane@example.com',
    borrowerPhone: '555-987-6543',
    borrowerSSN: '123-45-6789',
    borrowerDOB: '1985-03-15',
    borrowerIncome: 85000,
    borrowerAssets: 150000,
    borrowerIncomeSources: ['Employment', 'Rental Income'],
    borrowerBankAccounts: 3,
    propertyAddress: '123 Main St, Anytown, USA',
    propertyType: 'Single Family',
    loanType: 'DSCR',
    status: 'In Review',
    dscrScore: 1.25,
    propertyDetails: {
      city: 'Anytown',
      state: 'FL',
      zipCode: '33101',
      county: 'Miami-Dade',
      yearBuilt: 2010,
      squareFootage: 2500,
      bedrooms: 3,
      bathrooms: 2,
      lotSize: '0.25 acres',
      purchasePrice: 350000,
      appraisalValue: 375000,
      estimatedValue: 375000
    },
    loanDetails: {
      downPaymentPercentage: 20,
      monthlyRentalIncome: 2500,
      annualInsurance: 1200,
      annualTaxes: 2400,
      monthlyHoaFee: 0,
      ficoScore: '740-759',
      prepaymentPenalty: '5/4/3/2/1',
      discountPoints: 0,
      brokerPoints: 1,
      brokerAdminFee: 995,
      brokerYSP: 1
    }
  }

  try {
    await sendSlackNotification(applicationData)
    console.log('✅ Application notification test completed')
  } catch (error) {
    console.error('❌ Application notification test failed:', error)
  }

  // Test loan notification
  const loanData = {
    type: 'loan',
    partnerName: 'John Doe',
    partnerEmail: 'john@example.com',
    partnerPhone: '555-123-4567',
    partnerCompany: 'Visto Capital Partners',
    loanId: 'loan_456',
    applicationId: 'app_123',
    loanAmount: 500000,
    propertyAddress: '123 Main St, Anytown, USA',
    borrowerName: 'Jane Smith',
    borrowerEmail: 'jane@example.com',
    borrowerPhone: '555-987-6543',
    loanType: 'DSCR',
    propertyDetails: {
      city: 'Anytown',
      state: 'FL',
      zipCode: '33101'
    }
  }

  try {
    await sendSlackNotification(loanData)
    console.log('✅ Loan notification test completed')
  } catch (error) {
    console.error('❌ Loan notification test failed:', error)
  }
}

testSlackNotification() 