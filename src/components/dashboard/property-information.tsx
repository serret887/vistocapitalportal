"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home } from "lucide-react";

interface PropertyInformationProps {
  formData: {
    propertyState: string;
    propertyType: string;
    monthlyRentalIncome: number;
    annualPropertyInsurance: number;
    annualPropertyTaxes: number;
    monthlyHoaFee: number;
  };
  onFormDataChange: (updates: Partial<PropertyInformationProps['formData']>) => void;
  onNumberInput: (value: string, setter: (value: number) => void) => void;
  formatDisplayValue: (value: number) => string;
  setNeedsRecalculation: (value: boolean) => void;
  setValidationErrors: (errors: any[]) => void;
  setMatrixRequirements: (requirements: any) => void;
  STATE_MAPPING: Array<{ name: string; value: string }>;
}

export function PropertyInformation({
  formData,
  onFormDataChange,
  onNumberInput,
  formatDisplayValue,
  setNeedsRecalculation,
  setValidationErrors,
  setMatrixRequirements,
  STATE_MAPPING
}: PropertyInformationProps) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-800">Property Information</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="propertyState" className="text-xs font-medium">Property State</Label>
            <Select 
              value={formData.propertyState} 
              onValueChange={(value) => {
                onFormDataChange({ propertyState: value });
                setNeedsRecalculation(true);
                setValidationErrors([]);
                setMatrixRequirements(null);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATE_MAPPING.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="propertyType" className="text-xs font-medium">Property Type</Label>
            <Select 
              value={formData.propertyType} 
              onValueChange={(value) => {
                onFormDataChange({ propertyType: value });
                setNeedsRecalculation(true);
                setValidationErrors([]);
                setMatrixRequirements(null);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single Family">Single Family</SelectItem>
                <SelectItem value="Condo">Condo</SelectItem>
                <SelectItem value="Townhouse">Townhouse</SelectItem>
                <SelectItem value="Multi Family (5+ units)">Multi Family (5+ units)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="monthlyRentalIncome" className="text-xs font-medium">Monthly Rental Income</Label>
            <Input
              type="text"
              value={formatDisplayValue(formData.monthlyRentalIncome)}
              onChange={(e) => onNumberInput(e.target.value, (value) => onFormDataChange({ monthlyRentalIncome: value }))}
              placeholder="2500"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="annualPropertyInsurance" className="text-xs font-medium">Annual Property Insurance</Label>
            <Input
              type="text"
              value={formatDisplayValue(formData.annualPropertyInsurance)}
              onChange={(e) => onNumberInput(e.target.value, (value) => onFormDataChange({ annualPropertyInsurance: value }))}
              placeholder="1200"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="annualPropertyTaxes" className="text-xs font-medium">Annual Property Taxes</Label>
            <Input
              type="text"
              value={formatDisplayValue(formData.annualPropertyTaxes)}
              onChange={(e) => onNumberInput(e.target.value, (value) => onFormDataChange({ annualPropertyTaxes: value }))}
              placeholder="2400"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="monthlyHoaFee" className="text-xs font-medium">Monthly HOA Fee</Label>
            <Input
              type="text"
              value={formatDisplayValue(formData.monthlyHoaFee)}
              onChange={(e) => onNumberInput(e.target.value, (value) => onFormDataChange({ monthlyHoaFee: value }))}
              placeholder="0"
              className="h-8 text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 