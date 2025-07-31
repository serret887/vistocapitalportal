'use client'

import { forwardRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface EINInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export const EINInput = forwardRef<HTMLInputElement, EINInputProps>(
  ({ id, label, value, onChange, error, required = false, className, disabled = false }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    const formatEIN = (value: string) => {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '')
      
      // Format as XX-XXXXXXX
      if (digits.length <= 2) {
        return digits
      } else {
        return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      const formatted = formatEIN(rawValue)
      onChange(formatted)
    }

    const validateEIN = (ein: string): boolean => {
      const einRegex = /^\d{2}-\d{7}$/
      return einRegex.test(ein)
    }

    const isValid = value === '' || validateEIN(value)

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
          placeholder="12-3456789"
          required={required}
          disabled={disabled}
          maxLength={10}
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
          <p className="text-sm text-yellow-600 font-medium">Please enter a valid EIN (XX-XXXXXXX)</p>
        )}
      </div>
    )
  }
)

EINInput.displayName = 'EINInput' 