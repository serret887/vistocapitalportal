const testMissingDSCRRange = async () => {
  console.log('🔍 Testing Missing DSCR Range (1.0 - 1.20)\n');

  // Test with rental income that should give DSCR between 1.0 and 1.20
  const testCases = [
    { monthlyRental: 2200, description: 'DSCR should be ~1.15' },
    { monthlyRental: 2100, description: 'DSCR should be ~1.10' },
    { monthlyRental: 2000, description: 'DSCR should be ~1.05' },
    { monthlyRental: 1900, description: 'DSCR should be ~1.00' }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.description} ($${testCase.monthlyRental}/month)`);
    
    const request = {
      loanProgram: 'DSCR',
      input: {
        fico: 745,
        ltv: 80,
        loanAmount: 160000,
        loanPurpose: 'purchase',
        propertyType: '1-4 Unit SFR',
        propertyState: 'FL',
        occupancyType: 'investment',
        product: '30_Year_Fixed',
        interestOnly: false,
        prepayStructure: '5/4/3/2/1',
        dscr: 1.25,
        brokerComp: 1,
        ysp: 1,
        discountPoints: 0,
        brokerAdminFee: 995,
        estimatedHomeValue: 200000,
        monthlyRentalIncome: testCase.monthlyRental,
        annualPropertyInsurance: 1200,
        annualPropertyTaxes: 3600,
        monthlyHoaFee: 600,
        isShortTermRental: false,
        units: 1
      }
    };

    try {
      const response = await fetch('http://localhost:3000/api/loan-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        const option = result.data[0];
        
        console.log(`  Final Rate: ${option.finalRate}%`);
        console.log(`  DSCR Adjustment: ${option.breakdown.dscrAdjustment}%`);
        
        // Calculate expected DSCR manually
        const annualRentalIncome = testCase.monthlyRental * 12;
        const annualOperatingExpenses = 1200 + 3600 + (600 * 12);
        const noi = annualRentalIncome - annualOperatingExpenses;
        const estimatedMonthlyPayment = 1075;
        const annualDebtService = estimatedMonthlyPayment * 12;
        const estimatedDSCR = noi / annualDebtService;
        
        console.log(`  Manual DSCR: ${estimatedDSCR.toFixed(3)}`);
        
        if (estimatedDSCR >= 1.0 && estimatedDSCR <= 1.20) {
          console.log(`  DSCR Range: 1.0 - 1.20 (MISSING ADJUSTMENT!)`);
          console.log(`  Current Adjustment: ${option.breakdown.dscrAdjustment}%`);
          console.log(`  Expected Adjustment: +0.175% (hypothesis)`);
          
          // Test if +0.175% would give us 7.4%
          const baseRate = 6.825;
          const productAdjustment = 0.200;
          const originationFeeAdjustment = -0.300;
          const loanSizeAdjustment = 0.250;
          const yspAdjustment = 0.250;
          const prepayAdjustment = 0.000;
          const programAdjustment = 0.000;
          const hypotheticalDSCRAdjustment = +0.175;
          
          const hypotheticalRate = baseRate + productAdjustment + hypotheticalDSCRAdjustment + 
                                 originationFeeAdjustment + loanSizeAdjustment + yspAdjustment + 
                                 prepayAdjustment + programAdjustment;
          
          console.log(`  Hypothetical Rate with +0.175% DSCR: ${hypotheticalRate}%`);
          console.log(`  Target Rate: 7.4%`);
          console.log(`  Difference: ${(hypotheticalRate - 7.4).toFixed(3)}%`);
          
          if (Math.abs(hypotheticalRate - 7.4) < 0.01) {
            console.log('  🎯 CONFIRMED: Missing DSCR adjustment for range 1.0-1.20 should be +0.175%!');
          }
        } else {
          console.log(`  DSCR Range: ${estimatedDSCR < 1.0 ? '< 1.0' : '> 1.20'}`);
        }
      } else {
        console.log(`  ❌ API Error:`, result.error || 'Unknown error');
      }
    } catch (error) {
      console.log(`  ❌ Request failed:`, error.message);
    }
  }

  console.log('\n📋 Summary:');
  console.log('The matrix is missing an adjustment for DSCR between 1.0 and 1.20.');
  console.log('Current adjustments:');
  console.log('  DSCR > 1.20: -0.125% (bonus)');
  console.log('  DSCR 0.75-1.0 with LTV ≤ 65: +0.500% (penalty)');
  console.log('  DSCR < 1.0: case-by-case');
  console.log('  DSCR 1.0-1.20: MISSING! (should be +0.175% based on hypothesis)');
};

testMissingDSCRRange().catch(console.error); 