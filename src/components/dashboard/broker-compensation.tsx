"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface BrokerCompensationProps {
  formData: {
    brokerPoints: number;
    brokerAdminFee: number;
    discountPoints: number;
    brokerYsp: number;
  };
  onFormDataChange: (updates: Partial<BrokerCompensationProps['formData']>) => void;
  onNumberInput: (value: string, setter: (value: number) => void) => void;
  formatDisplayValue: (value: number) => string;
  setNeedsRecalculation: (value: boolean) => void;
  setValidationErrors: (errors: any[]) => void;
  setMatrixRequirements: (requirements: any) => void;
}

export function BrokerCompensation({
  formData,
  onFormDataChange,
  onNumberInput,
  formatDisplayValue,
  setNeedsRecalculation,
  setValidationErrors,
  setMatrixRequirements
}: BrokerCompensationProps) {
  const [validationErrors, setLocalValidationErrors] = useState<string[]>([]);

  // Validate broker points (max 2)
  useEffect(() => {
    const errors: string[] = [];
    
    if (formData.brokerPoints > 2) {
      errors.push("Broker points cannot exceed 2 points");
    }
    
    setLocalValidationErrors(errors);
    
    // Update parent validation errors
    if (errors.length > 0) {
      setValidationErrors([{ field: 'brokerPoints', message: errors[0] }]);
    } else {
      setValidationErrors([]);
    }
  }, [formData.brokerPoints, setValidationErrors]);
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-800">Broker Compensation</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="brokerPoints" className="text-xs font-medium">Broker Points (Max: 2)</Label>
            <Input
              type="text"
              value={formatDisplayValue(formData.brokerPoints)}
              onChange={(e) => {
                const cleanValue = e.target.value.replace(/[^0-9.-]/g, '');
                if (cleanValue === '') {
                  onFormDataChange({ brokerPoints: 0 });
                } else {
                  const numValue = parseFloat(cleanValue);
                  if (!isNaN(numValue)) {
                    // Cap at 2 points maximum
                    const cappedValue = Math.min(numValue, 2);
                    onFormDataChange({ brokerPoints: cappedValue });
                  }
                }
                setNeedsRecalculation(true);
                setValidationErrors([]);
                setMatrixRequirements(null);
              }}
              placeholder="1"
              className={`h-8 text-xs ${validationErrors.length > 0 ? 'border-red-500' : ''}`}
            />
            {validationErrors.length > 0 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>{validationErrors[0]}</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="brokerAdminFee" className="text-xs font-medium">Admin Fee</Label>
            <Input
              type="text"
              value={formatDisplayValue(formData.brokerAdminFee)}
              onChange={(e) => onNumberInput(e.target.value, (value) => onFormDataChange({ brokerAdminFee: value }))}
              placeholder="995"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="discountPoints" className="text-xs font-medium">Discount Points (Max: 3)</Label>
            <Select 
              value={formData.discountPoints.toString()} 
              onValueChange={(value) => {
                onFormDataChange({ discountPoints: parseFloat(value) });
                setNeedsRecalculation(true);
                setValidationErrors([]);
                setMatrixRequirements(null);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="0.25">0.25</SelectItem>
                <SelectItem value="0.5">0.5</SelectItem>
                <SelectItem value="0.75">0.75</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="1.25">1.25</SelectItem>
                <SelectItem value="1.5">1.5</SelectItem>
                <SelectItem value="1.75">1.75</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="2.25">2.25</SelectItem>
                <SelectItem value="2.5">2.5</SelectItem>
                <SelectItem value="2.75">2.75</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="brokerYsp" className="text-xs font-medium">Broker YSP</Label>
            <Select 
              value={formData.brokerYsp.toString()} 
              onValueChange={(value) => {
                onFormDataChange({ brokerYsp: parseFloat(value) });
                setNeedsRecalculation(true);
                setValidationErrors([]);
                setMatrixRequirements(null);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="0.25">0.25</SelectItem>
                <SelectItem value="0.5">0.5</SelectItem>
                <SelectItem value="0.75">0.75</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="1.25">1.25</SelectItem>
                <SelectItem value="1.5">1.5</SelectItem>
                <SelectItem value="1.75">1.75</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 