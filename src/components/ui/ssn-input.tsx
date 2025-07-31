'use client'

import { forwardRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface SSNInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export const SSNInput = forwardRef<HTMLInputElement, SSNInputProps>(
  ({ id, label, value, onChange, error, required = false, className, disabled = false }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    const formatSSN = (value: string) => {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '')
      
      // Format as XXX-XX-XXXX
      if (digits.length <= 3) {
        return digits
      } else if (digits.length <= 5) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`
      } else {
        return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      const formatted = formatSSN(rawValue)
      onChange(formatted)
    }

    const validateSSN = (ssn: string): boolean => {
      const ssnRegex = /^\d{3}-\d{2}-\d{4}$/
      return ssnRegex.test(ssn)
    }

    const isValid = value === '' || validateSSN(value)

    return (
      <div className="space-y-3">
        <Label htmlFor={id} className="text-base font-medium visto-dark-blue">
          {label} {required && '*'}
        </Label>
        <Input
          ref={ref}
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="123-45-6789"
          required={required}
          disabled={disabled}
          maxLength={11}
          className={cn(
            "border-2 focus:ring-2 focus:ring-primary focus:border-primary",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            !isValid && value !== '' && "border-yellow-500 focus:border-yellow-500 focus:ring-yellow-500",
            className
          )}
        />
        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}
        {!isValid && value !== '' && !error && (
          <p className="text-sm text-yellow-600 font-medium">Please enter a valid SSN (XXX-XX-XXXX)</p>
        )}
      </div>
    )
  }
)

SSNInput.displayName = 'SSNInput' 