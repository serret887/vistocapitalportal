'use client'

import { forwardRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ id, label, value, onChange, error, required = false, className, disabled = false }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    const formatPhoneNumber = (value: string) => {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '')
      
      // Format as (XXX) XXX-XXXX
      if (digits.length <= 3) {
        return digits
      } else if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      } else {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      const formatted = formatPhoneNumber(rawValue)
      onChange(formatted)
    }

    const validatePhone = (phone: string): boolean => {
      const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
      return phoneRegex.test(phone.replace(/\s/g, ''))
    }

    const isValid = value === '' || validatePhone(value)

    return (
      <div className="space-y-3">
        <Label htmlFor={id} className="text-base font-medium visto-dark-blue">
          {label} {required && '*'}
        </Label>
        <Input
          ref={ref}
          id={id}
          type="tel"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="(555) 123-4567"
          required={required}
          disabled={disabled}
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
          <p className="text-sm text-yellow-600 font-medium">Please enter a valid phone number</p>
        )}
      </div>
    )
  }
)

PhoneInput.displayName = 'PhoneInput' 