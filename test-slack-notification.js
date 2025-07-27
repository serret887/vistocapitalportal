// Test script for Slack notifications

async function sendSlackNotification(data) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  
  if (!webhookUrl) {
    console.log('Slack webhook URL not configured, skipping notification')
    return
  }

  try {
    const { type, partnerName, partnerEmail, applicationId, loanId, loanAmount, propertyAddress, borrowerName, borrowerEmail, status, dscrScore, loanType, propertyType } = data

    let title = ''
    let color = '#36a64f' // Green
    let fields = []

    if (type === 'application') {
      title = '📋 New Loan Application Submitted'
      fields = [
        {
          title: 'Partner',
          value: `${partnerName} (${partnerEmail})`,
          short: true
        },
        {
          title: 'Application ID',
          value: applicationId || 'N/A',
          short: true
        },
        {
          title: 'Borrower',
          value: borrowerName || 'N/A',
          short: true
        },
        {
          title: 'Borrower Email',
          value: borrowerEmail || 'N/A',
          short: true
        },
        {
          title: 'Property Address',
          value: propertyAddress || 'TBD',
          short: false
        },
        {
          title: 'Property Type',
          value: propertyType || 'N/A',
          short: true
        },
        {
          title: 'Loan Type',
          value: loanType || 'N/A',
          short: true
        },
        {
          title: 'Status',
          value: status || 'In Review',
          short: true
        }
      ]

      if (dscrScore) {
        fields.push({
          title: 'DSCR Score',
          value: dscrScore.toString(),
          short: true
        })
      }
    } else if (type === 'loan') {
      title = '💰 New Loan Created'
      color = '#ff6b6b' // Red
      fields = [
        {
          title: 'Partner',
          value: `${partnerName} (${partnerEmail})`,
          short: true
        },
        {
          title: 'Loan ID',
          value: loanId || 'N/A',
          short: true
        },
        {
          title: 'Application ID',
          value: applicationId || 'N/A',
          short: true
        },
        {
          title: 'Loan Amount',
          value: loanAmount ? `$${loanAmount.toLocaleString()}` : 'N/A',
          short: true
        },
        {
          title: 'Property Address',
          value: propertyAddress || 'N/A',
          short: false
        },
        {
          title: 'Borrower',
          value: borrowerName || 'N/A',
          short: true
        },
        {
          title: 'Borrower Email',
          value: borrowerEmail || 'N/A',
          short: true
        }
      ]
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
  console.log('Testing Slack notification...')
  
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