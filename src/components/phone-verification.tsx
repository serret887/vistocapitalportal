'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Phone, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface PhoneVerificationProps {
  phoneNumber: string
  onVerified: (phoneNumber: string) => void
  onSkip?: () => void
}

export function PhoneVerification({ phoneNumber, onVerified, onSkip }: PhoneVerificationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const [showOtpDisabled, setShowOtpDisabled] = useState(false)

  const sendOtp = async () => {
    setIsLoading(true)
    setError('')
    setShowOtpDisabled(false)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          shouldCreateUser: false, // Don't create a new user, just send OTP
        }
      })

      if (error) {
        // Handle the specific "Signups not allowed for otp" error
        if (error.message.includes('Signups not allowed for otp')) {
          setShowOtpDisabled(true)
          setError('Phone verification is currently disabled. You can proceed without verification.')
          toast.info('Phone verification is disabled. You can continue without verification.')
          return
        }
        throw error
      }

      setIsOtpSent(true)
      toast.success('Verification code sent to your phone number')
    } catch (error) {
      console.error('Error sending OTP:', error)
      setError(error instanceof Error ? error.message : 'Failed to send verification code')
      toast.error('Failed to send verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async () => {
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms'
      })

      if (error) {
        throw error
      }

      setIsVerified(true)
      toast.success('Phone number verified successfully!')
      onVerified(phoneNumber)
    } catch (error) {
      console.error('Error verifying OTP:', error)
      setError(error instanceof Error ? error.message : 'Invalid verification code')
      toast.error('Invalid verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    }
  }

  const handleProceedWithoutVerification = () => {
    // Mark as verified even without OTP verification
    setIsVerified(true)
    toast.success('Proceeding without phone verification')
    onVerified(phoneNumber)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Phone Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          We'll send a verification code to <strong>{phoneNumber}</strong>
        </div>

        {showOtpDisabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              <Info className="h-4 w-4" />
              Phone verification is currently disabled in this environment.
            </div>
            <div className="space-y-2">
              <Button 
                onClick={handleProceedWithoutVerification}
                className="w-full"
              >
                Continue Without Verification
              </Button>
              {onSkip && (
                <Button 
                  variant="outline" 
                  onClick={handleSkip}
                  className="w-full"
                >
                  Skip for now
                </Button>
              )}
            </div>
          </div>
        ) : !isOtpSent ? (
          <div className="space-y-4">
            <Button 
              onClick={sendOtp} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Button>
            {onSkip && (
              <Button 
                variant="outline" 
                onClick={handleSkip}
                className="w-full"
              >
                Skip for now
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter verification code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={verifyOtp} 
                disabled={isLoading || otp.length !== 6}
                className="flex-1"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsOtpSent(false)}
                disabled={isLoading}
              >
                Resend
              </Button>
            </div>
          </div>
        )}

        {error && !showOtpDisabled && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            {error.includes('rate limit') 
              ? 'Too many attempts. Please wait a few minutes before trying again.'
              : error.includes('invalid phone') 
              ? 'Please enter a valid phone number in international format.'
              : error
            }
          </div>
        )}

        {isVerified && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
            <CheckCircle className="h-4 w-4" />
            Phone number verified successfully!
          </div>
        )}
      </CardContent>
    </Card>
  )
} 