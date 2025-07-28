interface SlackNotificationData {
  type: 'application' | 'loan'
  partnerName: string
  partnerEmail: string
  partnerPhone?: string
  partnerCompany?: string
  applicationId?: string
  loanId?: string
  loanAmount?: number
  propertyAddress?: string
  borrowerName?: string
  borrowerEmail?: string
  borrowerPhone?: string
  borrowerSSN?: string
  borrowerDOB?: string
  borrowerIncome?: number
  borrowerAssets?: number
  borrowerIncomeSources?: string[]
  borrowerBankAccounts?: number
  status?: string
  dscrScore?: number
  loanType?: string
  propertyType?: string
  propertyDetails?: {
    city?: string
    state?: string
    zipCode?: string
    county?: string
    yearBuilt?: number
    squareFootage?: number
    bedrooms?: number
    bathrooms?: number
    lotSize?: string
    purchasePrice?: number
    appraisalValue?: number
    estimatedValue?: number
  }
  loanDetails?: {
    downPaymentPercentage?: number
    monthlyRentalIncome?: number
    annualInsurance?: number
    annualTaxes?: number
    monthlyHoaFee?: number
    ficoScore?: string
    prepaymentPenalty?: string
    discountPoints?: number
    brokerPoints?: number
    brokerAdminFee?: number
    brokerYSP?: number
  }
}

export async function sendSlackNotification(data: SlackNotificationData) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  
  if (!webhookUrl) {
    console.log('Slack webhook URL not configured, skipping notification')
    return
  }

  try {
    const { 
      type, 
      partnerName, 
      partnerEmail, 
      partnerPhone,
      partnerCompany,
      applicationId, 
      loanId, 
      loanAmount, 
      propertyAddress, 
      borrowerName, 
      borrowerEmail,
      borrowerPhone,
      borrowerSSN,
      borrowerDOB,
      borrowerIncome,
      borrowerAssets,
      borrowerIncomeSources,
      borrowerBankAccounts,
      status, 
      dscrScore, 
      loanType, 
      propertyType,
      propertyDetails,
      loanDetails
    } = data

    let title = ''
    let color = '#36a64f' // Green
    let fields: any[] = []

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

export async function sendApplicationNotification(application: any, partnerProfile: any) {
  await sendSlackNotification({
    type: 'application',
    partnerName: `${partnerProfile.first_name} ${partnerProfile.last_name}`,
    partnerEmail: partnerProfile.email,
    partnerPhone: partnerProfile.phone_number,
    partnerCompany: partnerProfile.company_name || undefined,
    applicationId: application.id,
    borrowerName: `${application.first_name} ${application.last_name}`,
    borrowerEmail: application.email,
    borrowerPhone: application.phone_number,
    borrowerSSN: application.ssn,
    borrowerDOB: application.date_of_birth,
    borrowerIncome: application.total_income,
    borrowerAssets: application.total_assets,
    borrowerIncomeSources: application.income_sources,
    borrowerBankAccounts: application.bank_accounts,
    propertyAddress: application.property_address,
    propertyType: application.property_type,
    loanType: application.loan_type,
    status: application.status,
    dscrScore: application.dscr_results?.dscr_score,
    propertyDetails: {
      city: application.property_city,
      state: application.property_state,
      zipCode: application.property_zip_code,
      county: application.property_county,
      yearBuilt: application.property_year_built,
      squareFootage: application.property_square_footage,
      bedrooms: application.property_bedrooms,
      bathrooms: application.property_bathrooms,
      lotSize: application.property_lot_size,
      purchasePrice: application.property_purchase_price,
      appraisalValue: application.property_appraisal_value,
      estimatedValue: application.estimated_home_value
    },
    loanDetails: {
      downPaymentPercentage: application.down_payment_percentage,
      monthlyRentalIncome: application.monthly_rental_income,
      annualInsurance: application.annual_property_insurance,
      annualTaxes: application.annual_property_taxes,
      monthlyHoaFee: application.monthly_hoa_fee,
      ficoScore: application.fico_score_range,
      prepaymentPenalty: application.prepayment_penalty,
      discountPoints: application.discount_points,
      brokerPoints: application.broker_points,
      brokerAdminFee: application.broker_admin_fee,
      brokerYSP: application.broker_ysp
    }
  })
}

export async function sendLoanNotification(loan: any, application: any, partnerProfile: any) {
  await sendSlackNotification({
    type: 'loan',
    partnerName: `${partnerProfile.first_name} ${partnerProfile.last_name}`,
    partnerEmail: partnerProfile.email,
    partnerPhone: partnerProfile.phone_number,
    partnerCompany: partnerProfile.company_name || undefined,
    loanId: loan.id,
    applicationId: application.id,
    loanAmount: loan.loan_amount,
    propertyAddress: application.property_address,
    borrowerName: `${application.first_name} ${application.last_name}`,
    borrowerEmail: application.email,
    borrowerPhone: application.phone_number,
    loanType: loan.loan_type,
    propertyDetails: {
      city: application.property_city,
      state: application.property_state,
      zipCode: application.property_zip_code
    }
  })
} 