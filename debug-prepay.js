const debugPrepayIssue = async () => {
  console.log('🔍 Debugging Prepayment Penalty Issue\n');

  // Test with different prepayment structures to see which ones work
  const testCases = [
    { prepayStructure: '5/4/3/2/1', expected: 0.000 },
    { prepayStructure: '3/3/3', expected: -0.175 },
    { prepayStructure: '5/5/5/5/5', expected: -0.250 },
    { prepayStructure: '3/2/1', expected: 0.250 },
    { prepayStructure: '3/0/0', expected: 0.500 },
    { prepayStructure: '0/0/0', expected: 1.000 },
    { prepayStructure: 'None', expected: 0.000 }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: "${testCase.prepayStructure}" (Expected: ${testCase.expected})`);
    
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
        prepayStructure: testCase.prepayStructure,
        dscr: 1.25,
        brokerComp: 1,
        ysp: 1,
        discountPoints: 0,
        brokerAdminFee: 995,
        estimatedHomeValue: 200000,
        monthlyRentalIncome: 5000,
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
        const prepayAdjustment = option.breakdown.prepayAdjustment;
        
        console.log(`  Result: ${prepayAdjustment}`);
        console.log(`  Status: ${prepayAdjustment === testCase.expected ? '✅ PASS' : '❌ FAIL'}`);
        
        if (prepayAdjustment === undefined) {
          console.log(`  ❌ ISSUE: prepayAdjustment is undefined for "${testCase.prepayStructure}"`);
        }
      } else {
        console.log(`  ❌ API Error:`, result.error || 'Unknown error');
      }
    } catch (error) {
      console.log(`  ❌ Request failed:`, error.message);
    }
  }

  // Also test the matrix lookup directly
  console.log('\n🔍 Testing Matrix Lookup Logic:');
  console.log('Available keys in matrix:');
  console.log('  "5/5/5/5/5": -0.250');
  console.log('  "3/3/3": -0.175');
  console.log('  "5/4/3/2/1": 0.000');
  console.log('  "3/2/1": 0.250');
  console.log('  "3/0/0": 0.500');
  console.log('  "0/0/0": 1.000');
  
  console.log('\nTest key lookups:');
  const testKeys = ['5/4/3/2/1', '3/3/3', '5/5/5/5/5'];
  testKeys.forEach(key => {
    console.log(`  "${key}" exists: ${key in {
      "5/5/5/5/5": -0.250,
      "3/3/3": -0.175,
      "5/4/3/2/1": 0.000,
      "3/2/1": 0.250,
      "3/0/0": 0.500,
      "0/0/0": 1.000
    }}`);
  });
};

debugPrepayIssue().catch(console.error); 