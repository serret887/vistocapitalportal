'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, DollarSign, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface BankStatement {
  id: string
  bank_name: string
  account_type: 'checking' | 'savings' | 'money_market' | 'cd' | 'investment'
  statement_file: File | null
  balance: number
  calculated_total: number
}

interface BankStatementInputProps {
  value: BankStatement[]
  onChange: (statements: BankStatement[]) => void
  onTotalChange?: (total: number) => void
  label?: string
  error?: string
}

export function BankStatementInput({ 
  value, 
  onChange, 
  onTotalChange, 
  label = "Bank Statements",
  error 
}: BankStatementInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const addStatement = () => {
    const newStatement: BankStatement = {
      id: Date.now().toString(),
      bank_name: '',
      account_type: 'checking',
      statement_file: null,
      balance: 0,
      calculated_total: 0
    }
    onChange([...value, newStatement])
  }

  const removeStatement = (id: string) => {
    const updatedStatements = value.filter(stmt => stmt.id !== id)
    onChange(updatedStatements)
    updateTotal(updatedStatements)
  }

  const updateStatement = (id: string, field: keyof BankStatement, newValue: any) => {
    const updatedStatements = value.map(stmt => 
      stmt.id === id ? { ...stmt, [field]: newValue } : stmt
    )
    onChange(updatedStatements)
    updateTotal(updatedStatements)
  }

  const updateTotal = (statements: BankStatement[]) => {
    const total = statements.reduce((sum, stmt) => sum + stmt.calculated_total, 0)
    onTotalChange?.(total)
  }

  const handleFileUpload = async (id: string, file: File) => {
    if (!file) return

    setIsProcessing(true)
    try {
      // Simulate processing the bank statement file
      // In a real implementation, you would parse the PDF/CSV file
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, generate a random balance between 1000 and 50000
      const calculatedBalance = Math.floor(Math.random() * 49000) + 1000
      
      const updatedStatements = value.map(stmt => 
        stmt.id === id 
          ? { ...stmt, statement_file: file, calculated_total: calculatedBalance }
          : stmt
      )
      
      onChange(updatedStatements)
      updateTotal(updatedStatements)
      toast.success('Bank statement processed successfully')
    } catch (error) {
      console.error('Error processing bank statement:', error)
      toast.error('Failed to process bank statement')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStatement}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Statement
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="space-y-4">
        {value.map((statement) => (
          <Card key={statement.id} className="border-2 border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Bank Statement</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStatement(statement.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Bank Name</Label>
                  <Input
                    value={statement.bank_name}
                    onChange={(e) => updateStatement(statement.id, 'bank_name', e.target.value)}
                    placeholder="Enter bank name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Account Type</Label>
                  <Select
                    value={statement.account_type}
                    onValueChange={(value) => updateStatement(statement.id, 'account_type', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="money_market">Money Market</SelectItem>
                      <SelectItem value="cd">Certificate of Deposit</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Bank Statement File</Label>
                <div className="mt-2">
                  {statement.statement_file ? (
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{statement.statement_file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(statement.statement_file.size)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Processed
                      </Badge>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Upload bank statement (PDF, CSV)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processing...' : 'Choose File'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.csv,.xlsx,.xls"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileUpload(statement.id, file)
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {statement.calculated_total > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Calculated Balance</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    ${statement.calculated_total.toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {value.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800">Total Assets</span>
          <span className="text-lg font-bold text-blue-800">
            ${value.reduce((sum, stmt) => sum + stmt.calculated_total, 0).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
} 