"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";

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
            <Label htmlFor="brokerPoints" className="text-xs font-medium">Broker Points</Label>
            <Input
              type="text"
              value={formatDisplayValue(formData.brokerPoints)}
              onChange={(e) => onNumberInput(e.target.value, (value) => onFormDataChange({ brokerPoints: value }))}
              placeholder="1"
              className="h-8 text-xs"
            />
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
            <Label htmlFor="discountPoints" className="text-xs font-medium">Discount Points</Label>
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