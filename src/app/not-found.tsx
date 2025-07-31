import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-visto-light via-white to-visto-light flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-visto-gold rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">404</span>
        </div>
        
        <h1 className="text-4xl font-bold visto-dark-blue mb-4">
          Page Not Found
        </h1>
        
        <p className="text-lg visto-slate mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="space-y-4">
          <Link href="/">
            <Button className="w-full bg-visto-gold hover:bg-visto-dark-gold text-white">
              Go Home
            </Button>
          </Link>
          
          <Link href="/dashboard">
            <Button variant="outline" className="w-full border-visto-gold text-visto-gold hover:bg-visto-gold hover:text-white">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 