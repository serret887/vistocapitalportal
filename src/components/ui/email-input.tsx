'use client'

import { forwardRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface EmailInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ id, label, value, onChange, error, required = false, className, disabled = false }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    const isValid = value === '' || validateEmail(value)

    return (
      <div className="space-y-3">
        <Label htmlFor={id} className="text-base font-medium visto-dark-blue">
          {label} {required && '*'}
        </Label>
        <Input
          ref={ref}
          id={id}
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="example@email.com"
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
          <p className="text-sm text-yellow-600 font-medium">Please enter a valid email address</p>
        )}
      </div>
    )
  }
)

EmailInput.displayName = 'EmailInput' 