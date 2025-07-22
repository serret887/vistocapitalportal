"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, User, Percent, TrendingUp, InfoIcon, RefreshCw } from 'lucide-react';
import { US_STATES } from '@/types';

interface DSCRResults {
  dscr: number;
  monthlyPayment: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

interface LoanOption {
  rate: number;
  points: number;
  monthlyPayment: number;
  dscr: number;
}

export default function DSCRCalculator() {
  const [formData, setFormData] = useState({
    transactionType: 'Purchase',
    propertyState: 'Florida',
    propertyType: 'Single Family',
    ficoScore: '760-779',
    estimatedHomeValue: 200000,
    downPayment: 20,
    loanAmount: 160000,
    remainingMortgage: 120000,
    acquisitionDate: '',
    prepaymentPenalty: 'None',
    brokerPoints: 0,
    brokerAdminFee: 0,
    monthlyRentalIncome: 0,
    annualPropertyInsurance: 0,
    annualPropertyTaxes: 0,
    monthlyHoaFee: 0,
    titleInsurance: 0,
    escrowFees: 0,
    appraisalFee: 0,
    creditReport: 0,
    floodCert: 0,
    taxService: 0,
  });

  const [results, setResults] = useState<DSCRResults | null>(null);

  const handlePropertyValueChange = (value: number) => {
    const newLoanAmount = formData.transactionType === 'Purchase' 
      ? value * (1 - formData.downPayment / 100)
      : formData.loanAmount;
    
    setFormData({
      ...formData,
      estimatedHomeValue: value,
      loanAmount: newLoanAmount,
    });
  };

  const handleDownPaymentChange = (value: number) => {
    const newLoanAmount = formData.estimatedHomeValue * (1 - value / 100);
    setFormData({
      ...formData,
      downPayment: value,
      loanAmount: newLoanAmount,
    });
  };

  const calculateDSCR = () => {
    const monthlyRentalIncome = formData.monthlyRentalIncome;
    const monthlyInsurance = formData.annualPropertyInsurance / 12;
    const monthlyTaxes = formData.annualPropertyTaxes / 12;
    const monthlyHoa = formData.monthlyHoaFee;
    
    // Simplified monthly payment calculation (you can make this more complex)
    const monthlyPayment = formData.loanAmount * 0.006; // Rough estimate
    
    const monthlyExpenses = monthlyPayment + monthlyInsurance + monthlyTaxes + monthlyHoa;
    const dscr = monthlyRentalIncome / monthlyExpenses;
    
    setResults({
      dscr: dscr || 1.20,
      monthlyPayment,
      monthlyIncome: monthlyRentalIncome,
      monthlyExpenses,
    });
  };

  const resetForm = () => {
    setFormData({
      transactionType: 'Purchase',
      propertyState: 'Florida',
      propertyType: 'Single Family',
      ficoScore: '760-779',
      estimatedHomeValue: 200000,
      downPayment: 20,
      loanAmount: 160000,
      remainingMortgage: 120000,
      acquisitionDate: '',
      prepaymentPenalty: 'None',
      brokerPoints: 0,
      brokerAdminFee: 0,
      monthlyRentalIncome: 0,
      annualPropertyInsurance: 0,
      annualPropertyTaxes: 0,
      monthlyHoaFee: 0,
      titleInsurance: 0,
      escrowFees: 0,
      appraisalFee: 0,
      creditReport: 0,
      floodCert: 0,
      taxService: 0,
    });
    setResults(null);
  };

  const getDSCRStatus = (dscr: number) => {
    if (dscr >= 1.25) return 'text-green-600 bg-green-50';
    if (dscr >= 1.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calculator className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Estimate Your Rental Rate</h1>
        </div>
        <p className="text-gray-600">Simple calculator for realtors and partners.</p>
      </div>

      {/* Input Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Column - Borrower Information and 3rd Party Expenses */}
        <div className="space-y-6">
          {/* Borrower Information - Smaller */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Borrower Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="transactionType">Transaction Type</Label>
                  <Select value={formData.transactionType} onValueChange={(value) => setFormData({...formData, transactionType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Purchase">Purchase</SelectItem>
                      <SelectItem value="Refinance">Refinance</SelectItem>
                      <SelectItem value="Cash Out">Cash Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="propertyState">Property State</Label>
                  <Select value={formData.propertyState} onValueChange={(value) => setFormData({...formData, propertyState: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select value={formData.propertyType} onValueChange={(value) => setFormData({...formData, propertyType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Family">Single Family</SelectItem>
                      <SelectItem value="Multi Family">Multi Family</SelectItem>
                      <SelectItem value="Condo">Condo</SelectItem>
                      <SelectItem value="Townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ficoScore">Est. FICO Score</Label>
                  <Select value={formData.ficoScore} onValueChange={(value) => setFormData({...formData, ficoScore: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="600-619">600-619</SelectItem>
                      <SelectItem value="620-639">620-639</SelectItem>
                      <SelectItem value="640-659">640-659</SelectItem>
                      <SelectItem value="660-679">660-679</SelectItem>
                      <SelectItem value="680-699">680-699</SelectItem>
                      <SelectItem value="700-719">700-719</SelectItem>
                      <SelectItem value="720-739">720-739</SelectItem>
                      <SelectItem value="740-759">740-759</SelectItem>
                      <SelectItem value="760-779">760-779</SelectItem>
                      <SelectItem value="780+">780+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="estimatedHomeValue">Estimated Home Value</Label>
                  <Input
                    type="number"
                    value={formData.estimatedHomeValue}
                    onChange={(e) => handlePropertyValueChange(Number(e.target.value))}
                    placeholder="200000"
                  />
                </div>

                {formData.transactionType === "Purchase" ? (
                  <div>
                    <Label htmlFor="downPayment">Down Payment (%)</Label>
                    <Input
                      type="number"
                      value={formData.downPayment}
                      onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
                      placeholder="20"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="remainingMortgage">Remaining Mortgage</Label>
                    <Input
                      type="number"
                      value={formData.remainingMortgage}
                      onChange={(e) => setFormData({...formData, remainingMortgage: Number(e.target.value)})}
                      placeholder="120000"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="loanAmount">Loan Amount</Label>
                  <Input
                    type="number"
                    value={formData.loanAmount}
                    onChange={(e) => setFormData({...formData, loanAmount: Number(e.target.value)})}
                    placeholder={formData.transactionType === "Purchase" ? "160000" : "120000"}
                  />
                </div>

                {formData.transactionType === "Refinance" && (
                  <div>
                    <Label htmlFor="acquisitionDate" className="flex items-center gap-1">
                      Prop. Acquisition Date
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </Label>
                    <Input
                      type="text"
                      value={formData.acquisitionDate}
                      onChange={(e) => setFormData({...formData, acquisitionDate: e.target.value})}
                      placeholder="04/22/2025"
                    />
                  </div>
                )}

                {formData.transactionType === "Refinance" && (
                  <div>
                    <Label htmlFor="prepaymentPenalty">Prepayment Penalty</Label>
                    <Select value={formData.prepaymentPenalty} onValueChange={(value) => setFormData({...formData, prepaymentPenalty: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7-year term">7-year term</SelectItem>
                        <SelectItem value="5-year term">5-year term</SelectItem>
                        <SelectItem value="3-year term">3-year term</SelectItem>
                        <SelectItem value="None">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3rd Party Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-orange-600" />
                3rd Party Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="titleInsurance">Title Insurance</Label>
                  <Input
                    type="number"
                    value={formData.titleInsurance || 0}
                    onChange={(e) => setFormData({...formData, titleInsurance: Number(e.target.value)})}
                    placeholder="1500"
                  />
                </div>

                <div>
                  <Label htmlFor="escrowFees">Escrow Fees</Label>
                  <Input
                    type="number"
                    value={formData.escrowFees || 0}
                    onChange={(e) => setFormData({...formData, escrowFees: Number(e.target.value)})}
                    placeholder="500"
                  />
                </div>

                <div>
                  <Label htmlFor="appraisalFee">Appraisal Fee</Label>
                  <Input
                    type="number"
                    value={formData.appraisalFee || 0}
                    onChange={(e) => setFormData({...formData, appraisalFee: Number(e.target.value)})}
                    placeholder="450"
                  />
                </div>

                <div>
                  <Label htmlFor="creditReport">Credit Report</Label>
                  <Input
                    type="number"
                    value={formData.creditReport || 0}
                    onChange={(e) => setFormData({...formData, creditReport: Number(e.target.value)})}
                    placeholder="50"
                  />
                </div>

                <div>
                  <Label htmlFor="floodCert">Flood Certificate</Label>
                  <Input
                    type="number"
                    value={formData.floodCert || 0}
                    onChange={(e) => setFormData({...formData, floodCert: Number(e.target.value)})}
                    placeholder="25"
                  />
                </div>

                <div>
                  <Label htmlFor="taxService">Tax Service</Label>
                  <Input
                    type="number"
                    value={formData.taxService || 0}
                    onChange={(e) => setFormData({...formData, taxService: Number(e.target.value)})}
                    placeholder="75"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Broker Compensation and DSCR */}
        <div className="space-y-6">
          {/* Broker Compensation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-purple-600" />
                Broker Compensation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brokerPoints">Broker Points (%)</Label>
                <Input
                  type="number"
                  value={formData.brokerPoints}
                  onChange={(e) => setFormData({...formData, brokerPoints: Number(e.target.value)})}
                  placeholder="2"
                />
              </div>
              <div>
                <Label htmlFor="brokerAdminFee" className="flex items-center gap-1">
                  Broker Admin Fee ($)
                  <InfoIcon className="h-4 w-4 text-gray-400" />
                </Label>
                <Input
                  type="number"
                  value={formData.brokerAdminFee}
                  onChange={(e) => setFormData({...formData, brokerAdminFee: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* DSCR */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Debt Service Coverage Ratio (DSCR)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="monthlyRentalIncome">Est. Monthly Rental Income</Label>
                  <Input
                    type="number"
                    value={formData.monthlyRentalIncome}
                    onChange={(e) => setFormData({...formData, monthlyRentalIncome: Number(e.target.value)})}
                    placeholder="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="annualPropertyInsurance">Est. Annual Property Insurance</Label>
                  <Input
                    type="number"
                    value={formData.annualPropertyInsurance}
                    onChange={(e) => setFormData({...formData, annualPropertyInsurance: Number(e.target.value)})}
                    placeholder="1200"
                  />
                </div>
                <div>
                  <Label htmlFor="annualPropertyTaxes">Est. Annual Property Taxes</Label>
                  <Input
                    type="number"
                    value={formData.annualPropertyTaxes}
                    onChange={(e) => setFormData({...formData, annualPropertyTaxes: Number(e.target.value)})}
                    placeholder="2400"
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyHoaFee">Est. Monthly HOA Fee</Label>
                  <Input
                    type="number"
                    value={formData.monthlyHoaFee}
                    onChange={(e) => setFormData({...formData, monthlyHoaFee: Number(e.target.value)})}
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-500 mt-1">• When Applicable</p>
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Estimated DSCR Calculation:</Label>
                  <div className="text-xl font-bold text-green-900">
                    {results ? results.dscr.toFixed(2) : '1.20'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button onClick={calculateDSCR} className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Get Loan Quotes
        </Button>
        <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Reset Form
        </Button>
      </div>

      {/* Results Section */}
      {results && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Loan Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { rate: 7.5, points: 0, monthlyPayment: 1120, dscr: 1.25 },
                  { rate: 7.25, points: 1, monthlyPayment: 1090, dscr: 1.28 },
                  { rate: 7.0, points: 2, monthlyPayment: 1060, dscr: 1.32 },
                ].map((option, index) => (
                  <Card key={index} className="border-2 hover:border-blue-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <div className="text-2xl font-bold text-blue-600">{option.rate}%</div>
                        <div className="text-sm text-gray-600">{option.points} Points</div>
                        <Separator />
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-gray-600">Monthly Payment:</span>
                            <span className="font-semibold ml-1">${option.monthlyPayment}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">DSCR:</span>
                            <Badge className={`ml-1 ${getDSCRStatus(option.dscr)}`}>
                              {option.dscr}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 