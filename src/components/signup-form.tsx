'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signUp, getCurrentUser } from "@/lib/auth-client"
import { toast } from "sonner"

// Generate a unique request ID for this component instance
const generateRequestId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const router = useRouter()
  const requestId = generateRequestId()

  console.log(`[${requestId}] SignupForm component initialized`)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    console.log(`[${requestId}] Input change: ${name}`, {
      hasValue: !!value,
      valueLength: value.length,
      isPassword: name === 'password' || name === 'confirmPassword',
      isEmail: name === 'email'
    })
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    console.log(`[${requestId}] Validating signup form`, {
      hasFirstName: !!formData.firstName.trim(),
      hasLastName: !!formData.lastName.trim(),
      hasEmail: !!formData.email.trim(),
      hasPassword: !!formData.password,
      hasConfirmPassword: !!formData.confirmPassword,
      passwordLength: formData.password.length,
      passwordsMatch: formData.password === formData.confirmPassword
    })

    if (!formData.firstName.trim()) {
      console.log(`[${requestId}] Validation failed: First name is required`)
      toast.error('First name is required')
      return false
    }
    if (!formData.lastName.trim()) {
      console.log(`[${requestId}] Validation failed: Last name is required`)
      toast.error('Last name is required')
      return false
    }
    if (!formData.email.trim()) {
      console.log(`[${requestId}] Validation failed: Email is required`)
      toast.error('Email is required')
      return false
    }
    if (!formData.password) {
      console.log(`[${requestId}] Validation failed: Password is required`)
      toast.error('Password is required')
      return false
    }
    if (formData.password.length < 6) {
      console.log(`[${requestId}] Validation failed: Password too short`, {
        passwordLength: formData.password.length
      })
      toast.error('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      console.log(`[${requestId}] Validation failed: Passwords do not match`)
      toast.error('Passwords do not match')
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      console.log(`[${requestId}] Validation failed: Invalid email format`, {
        email: `${formData.email.substring(0, 3)}***@${formData.email.split('@')[1]}`
      })
      toast.error('Please enter a valid email address')
      return false
    }

    console.log(`[${requestId}] Form validation passed`)
    return true
  }

  const waitForSession = async (maxAttempts = 10): Promise<boolean> => {
    console.log(`[${requestId}] Waiting for session establishment`)
    for (let i = 0; i < maxAttempts; i++) {
      const { user, error } = await getCurrentUser()
      if (user && !error) {
        console.log(`[${requestId}] Session established successfully on attempt ${i + 1}`)
        return true
      }
      console.log(`[${requestId}] Session attempt ${i + 1}/${maxAttempts} - waiting...`)
      await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms between attempts
    }
    console.log(`[${requestId}] Session establishment failed after ${maxAttempts} attempts`)
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log(`[${requestId}] Signup form submitted`, {
      hasFirstName: !!formData.firstName,
      hasLastName: !!formData.lastName,
      hasEmail: !!formData.email,
      hasPassword: !!formData.password,
      hasConfirmPassword: !!formData.confirmPassword,
      emailPreview: formData.email ? `${formData.email.substring(0, 3)}***@${formData.email.split('@')[1]}` : null
    })
    
    if (!validateForm()) {
      console.log(`[${requestId}] Form validation failed, aborting signup`)
      return
    }

    setIsLoading(true)
    console.log(`[${requestId}] Starting signup process`)

    try {
      console.log(`[${requestId}] Calling signUp API`)
      const { user, error } = await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      })

      if (error) {
        console.log(`[${requestId}] Signup failed`, {
          error: error.message,
          errorName: error.name || 'unknown'
        })
        toast.error(error.message || 'Failed to create account')
        return
      }

      if (user) {
        console.log(`[${requestId}] Signup successful`, {
          userId: user.id,
          userEmail: user.email,
          hasFirstName: !!user.firstName,
          hasLastName: !!user.lastName
        })
        toast.success('Account created successfully! Please sign in.')
        
        // Wait for session to be established
        console.log(`[${requestId}] Waiting for session establishment`)
        const sessionEstablished = await waitForSession()
        
        if (sessionEstablished) {
          console.log(`[${requestId}] Session established, redirecting to dashboard`)
          window.location.href = '/dashboard'
        } else {
          console.log(`[${requestId}] Session not established, redirecting to login`)
          window.location.href = '/login'
        }
      } else {
        console.log(`[${requestId}] Signup failed: No user data returned`)
        toast.error('Account creation failed. Please try again.')
      }
    } catch (error) {
      console.error(`[${requestId}] Signup error:`, error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
      console.log(`[${requestId}] Signup process completed`)
    }
  }

  console.log(`[${requestId}] Rendering SignupForm`)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-balance">
                  Join the Visto Capital Partner Portal
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="partner@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" type="button" className="w-full" disabled={isLoading}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="ml-2">Google</span>
                </Button>
                <Button variant="outline" type="button" className="w-full" disabled={isLoading}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="ml-2">Microsoft</span>
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Sign in
                </Link>
            </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 opacity-90" />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mb-6">
                <Image 
                  src="/favicons/android-chrome-192x192.png" 
                  alt="Visto Capital" 
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg"
                />
              </div>
              <h2 className="text-2xl font-bold mb-2">Visto Capital</h2>
              <p className="text-center text-lg opacity-90 mb-4">
                Join thousands of successful partners
              </p>
              <div className="text-center space-y-2 text-sm opacity-80">
                <p>✓ Manage your deals and clients</p>
                <p>✓ Access exclusive opportunities</p>
                <p>✓ Track your performance metrics</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  )
} 