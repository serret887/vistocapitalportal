'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export const dynamic = 'force-dynamic'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-visto-light via-white to-visto-light flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">!</span>
        </div>
        
        <h1 className="text-4xl font-bold visto-dark-blue mb-4">
          Something went wrong
        </h1>
        
        <p className="text-lg visto-slate mb-8">
          An error occurred while loading this page. Please try again.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={reset}
            className="w-full bg-visto-gold hover:bg-visto-dark-gold text-white"
          >
            Try again
          </Button>
          
          <Link href="/">
            <Button variant="outline" className="w-full border-visto-gold text-visto-gold hover:bg-visto-gold hover:text-white">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 