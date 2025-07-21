'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, DollarSign, Home, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function MortgageAffordabilityPage() {
  const [income, setIncome] = useState('')
  const [debts, setDebts] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [interestRate, setInterestRate] = useState('7.0')
  const [results, setResults] = useState<{
    maxLoanAmount: number
    maxHomePrice: number
    monthlyPayment: number
    debtToIncomeRatio: number
  } | null>(null)

  const calculateAffordability = () => {
    const monthlyIncome = parseFloat(income) / 12
    const monthlyDebts = parseFloat(debts)
    const downPaymentAmount = parseFloat(downPayment)
    const rate = parseFloat(interestRate) / 100 / 12
    
    if (!monthlyIncome || monthlyIncome <= 0) return

    // DTI calculation (28% front-end ratio, 36% back-end ratio)
    const maxHousingPayment = monthlyIncome * 0.28
    const maxTotalPayment = monthlyIncome * 0.36
    const availableForHousing = Math.min(maxHousingPayment, maxTotalPayment - monthlyDebts)
    
    if (availableForHousing <= 0) {
      setResults({
        maxLoanAmount: 0,
        maxHomePrice: 0,
        monthlyPayment: 0,
        debtToIncomeRatio: (monthlyDebts / monthlyIncome) * 100
      })
      return
    }

    // Estimate property taxes and insurance (roughly 1.2% annually)
    const estimatedTaxInsurance = availableForHousing * 0.15
    const availableForPrincipalInterest = availableForHousing - estimatedTaxInsurance
    
    // Calculate max loan amount using PMT formula
    const n = 30 * 12 // 30 years
    const maxLoanAmount = availableForPrincipalInterest * (Math.pow(1 + rate, n) - 1) / (rate * Math.pow(1 + rate, n))
    
    const maxHomePrice = maxLoanAmount + downPaymentAmount
    
    setResults({
      maxLoanAmount: Math.max(0, maxLoanAmount),
      maxHomePrice: Math.max(0, maxHomePrice),
      monthlyPayment: availableForHousing,
      debtToIncomeRatio: (monthlyDebts / monthlyIncome) * 100
    })
  }

  const reset = () => {
    setIncome('')
    setDebts('')
    setDownPayment('')
    setInterestRate('7.0')
    setResults(null)
  }

  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Calculator className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold visto-dark-blue tracking-tight">
            Mortgage Affordability Calculator
          </h1>
          <p className="text-xl visto-slate mt-2">
            Help clients determine their home buying budget
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold visto-dark-blue">
              Financial Information
            </CardTitle>
            <CardDescription className="text-lg visto-slate">
              Enter your client's financial details
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="income" className="text-lg font-medium visto-dark-blue">
                Annual Gross Income
              </Label>
              <Input
                id="income"
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="75000"
                className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="debts" className="text-lg font-medium visto-dark-blue">
                Monthly Debt Payments
              </Label>
              <Input
                id="debts"
                type="number"
                value={debts}
                onChange={(e) => setDebts(e.target.value)}
                placeholder="500"
                className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="text-sm visto-slate">
                Include car loans, credit cards, student loans, etc.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="downPayment" className="text-lg font-medium visto-dark-blue">
                Available Down Payment
              </Label>
              <Input
                id="downPayment"
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                placeholder="20000"
                className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="interestRate" className="text-lg font-medium visto-dark-blue">
                Interest Rate (%)
              </Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                onClick={calculateAffordability}
                className="flex-1 px-8 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={!income}
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculate
              </Button>
              
              <Button
                onClick={reset}
                variant="outline"
                className="px-8 py-4 text-lg border-2 border-primary text-primary hover:bg-primary/5"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold visto-dark-blue">
              Affordability Results
            </CardTitle>
            <CardDescription className="text-lg visto-slate">
              Based on 28/36 debt-to-income ratios
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {results ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <Card className="border border-primary/20 bg-gradient-visto-subtle p-4">
                    <div className="flex items-center space-x-3">
                      <Home className="w-8 h-8 text-primary" />
                      <div>
                        <div className="text-sm visto-slate">Maximum Home Price</div>
                        <div className="text-2xl font-bold visto-dark-blue">
                          ${results.maxHomePrice.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="border border-border p-4">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="text-sm visto-slate">Maximum Loan Amount</div>
                        <div className="text-xl font-bold visto-dark-blue">
                          ${results.maxLoanAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="border border-border p-4">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="text-sm visto-slate">Estimated Monthly Payment</div>
                        <div className="text-xl font-bold visto-dark-blue">
                          ${results.monthlyPayment.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium visto-dark-blue">Current Debt-to-Income Ratio:</span>
                    <span className={`text-lg font-bold ${
                      results.debtToIncomeRatio > 36 ? 'text-red-600' : 
                      results.debtToIncomeRatio > 28 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {results.debtToIncomeRatio.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="mt-4 text-sm visto-slate">
                    {results.debtToIncomeRatio > 36 && (
                      <p className="text-red-600 font-medium">
                        ⚠️ High debt-to-income ratio. Consider reducing debts or increasing income.
                      </p>
                    )}
                    {results.debtToIncomeRatio <= 36 && results.debtToIncomeRatio > 28 && (
                      <p className="text-yellow-600 font-medium">
                        💡 Moderate debt-to-income ratio. Good foundation for home buying.
                      </p>
                    )}
                    {results.debtToIncomeRatio <= 28 && (
                      <p className="text-green-600 font-medium">
                        ✅ Excellent debt-to-income ratio. Strong home buying position.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border text-xs visto-slate">
                  <p>
                    * Estimates include property taxes and insurance. Actual amounts may vary.
                    This calculator uses the 28/36 rule: housing costs should not exceed 28% of gross income,
                    and total debt should not exceed 36% of gross income.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Calculator className="w-16 h-16 visto-gold mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium visto-dark-blue mb-2">
                  Ready to Calculate
                </h3>
                <p className="text-lg visto-slate">
                  Enter financial information and click "Calculate" to see affordability results.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 