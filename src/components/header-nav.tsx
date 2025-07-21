'use client'

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

export function HeaderNav() {
  const pathname = usePathname()
  
  // Don't show header on dashboard pages (they have their own sidebar navigation)
  // Don't show header on onboarding pages (focused flow)
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/onboarding')) {
    return null
  }
  
  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50 shadow-sm">
      <div className="container flex h-20 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image 
            src="/favicons/favicon-32x32.png" 
            alt="Visto Capital" 
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg shadow-sm"
          />
          <span className="text-xl font-bold visto-dark-blue tracking-tight">Visto Capital</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          {pathname === '/login' ? (
            <div className="flex items-center gap-4">
              <span className="text-base visto-slate">New partner?</span>
              <Link href="/signup">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-primary text-primary hover:bg-primary/5 transition-all duration-200 font-semibold px-6"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          ) : pathname === '/signup' ? (
            <div className="flex items-center gap-4">
              <span className="text-base visto-slate">Already have an account?</span>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-primary text-primary hover:bg-primary/5 transition-all duration-200 font-semibold px-6"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  size="lg"
                  className="text-primary hover:bg-primary/5 font-semibold px-6 transition-all duration-200"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
} 