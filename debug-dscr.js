const debugDSCRCalculation = async () => {
  console.log('🔍 Debugging DSCR Calculation Issue\n');

  // Test with different rental incomes to see how DSCR changes
  const testCases = [
    { monthlyRental: 5000, description: 'High Rental Income' },
    { monthlyRental: 4000, description: 'Medium Rental Income' },
    { monthlyRental: 3000, description: 'Low Rental Income' },
    { monthlyRental: 2500, description: 'Very Low Rental Income' },
    { monthlyRental: 2000, description: 'Extremely Low Rental Income' }
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
        const annualOperatingExpenses = 1200 + 3600 + (600 * 12); // insurance + taxes + hoa
        const noi = annualRentalIncome - annualOperatingExpenses;
        
        // Estimate monthly payment for 7.1% rate (approximate)
        const estimatedMonthlyPayment = 1075; // From previous tests
        const annualDebtService = estimatedMonthlyPayment * 12;
        const estimatedDSCR = noi / annualDebtService;
        
        console.log(`  Manual DSCR Calculation:`);
        console.log(`    Annual Rental: $${annualRentalIncome.toLocaleString()}`);
        console.log(`    Annual Expenses: $${annualOperatingExpenses.toLocaleString()}`);
        console.log(`    NOI: $${noi.toLocaleString()}`);
        console.log(`    Annual Debt Service: $${annualDebtService.toLocaleString()}`);
        console.log(`    Estimated DSCR: ${estimatedDSCR.toFixed(3)}`);
        
        if (estimatedDSCR > 1.20) {
          console.log(`  Expected DSCR Adjustment: -0.125% (bonus for DSCR > 1.20)`);
        } else if (estimatedDSCR >= 0.75 && estimatedDSCR < 1.00) {
          console.log(`  Expected DSCR Adjustment: +0.500% (penalty for DSCR 0.75-1.0 with LTV ≤ 65)`);
        } else {
          console.log(`  Expected DSCR Adjustment: 0.000% (no adjustment)`);
        }
        
        console.log(`  Actual DSCR Adjustment: ${option.breakdown.dscrAdjustment}%`);
        
        if (Math.abs(option.finalRate - 7.4) < 0.1) {
          console.log('  ✅ SUCCESS: Rate matches expected 7.4%!');
        } else {
          console.log(`  ❌ FAILED: Rate difference = ${(option.finalRate - 7.4).toFixed(3)}%`);
        }
      } else {
        console.log(`  ❌ API Error:`, result.error || 'Unknown error');
      }
    } catch (error) {
      console.log(`  ❌ Request failed:`, error.message);
    }
  }

  // Test the hypothesis: what if we force a specific DSCR adjustment?
  console.log('\n🧮 Testing Hypothesis: What if DSCR adjustment was +0.175% instead of -0.125%?');
  
  const baseRate = 6.825;
  const productAdjustment = 0.200;
  const originationFeeAdjustment = -0.300;
  const loanSizeAdjustment = 0.250;
  const yspAdjustment = 0.250;
  const prepayAdjustment = 0.000;
  const programAdjustment = 0.000;
  
  // Current calculation (with DSCR bonus)
  const currentDSCRAdjustment = -0.125;
  const currentRate = baseRate + productAdjustment + currentDSCRAdjustment + 
                     originationFeeAdjustment + loanSizeAdjustment + yspAdjustment + 
                     prepayAdjustment + programAdjustment;
  
  // Hypothetical calculation (with DSCR penalty)
  const hypotheticalDSCRAdjustment = +0.175;
  const hypotheticalRate = baseRate + productAdjustment + hypotheticalDSCRAdjustment + 
                          originationFeeAdjustment + loanSizeAdjustment + yspAdjustment + 
                          prepayAdjustment + programAdjustment;
  
  console.log(`  Current Rate (DSCR bonus): ${currentRate}%`);
  console.log(`  Hypothetical Rate (DSCR penalty): ${hypotheticalRate}%`);
  console.log(`  Target Rate: 7.4%`);
  console.log(`  Current Difference: ${(currentRate - 7.4).toFixed(3)}%`);
  console.log(`  Hypothetical Difference: ${(hypotheticalRate - 7.4).toFixed(3)}%`);
  
  if (Math.abs(hypotheticalRate - 7.4) < 0.01) {
    console.log('  🎯 HYPOTHESIS CONFIRMED: DSCR adjustment should be +0.175% to reach 7.4%!');
  }
};

debugDSCRCalculation().catch(console.error); 