'use client'

import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormInputProps {
  id: string
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ id, label, type = 'text', placeholder, value, onChange, error, required = false, className, disabled = false }, ref) => {
    return (
      <div className="space-y-3">
        <Label htmlFor={id} className="text-base font-medium visto-dark-blue">
          {label} {required && '*'}
        </Label>
        <Input
          ref={ref}
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={cn(
            "border-2 focus:ring-2 focus:ring-primary focus:border-primary",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
        />
        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput' 