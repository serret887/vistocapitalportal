import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Visto Capital Partner Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join the Visto Capital network of successful real estate partners and grow your business with our comprehensive support and resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Wholesalers</CardTitle>
              <CardDescription>
                Access exclusive deals and streamline your wholesale operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Exclusive property leads</li>
                <li>• Quick funding options</li>
                <li>• Market analysis tools</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>Investors</CardTitle>
              <CardDescription>
                Build your real estate portfolio with our investment opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Long-term rental properties</li>
                <li>• Portfolio management tools</li>
                <li>• Investment analysis</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>Real Estate Agents</CardTitle>
              <CardDescription>
                Expand your client base and increase your commission potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Lead generation support</li>
                <li>• Marketing materials</li>
                <li>• Commission tracking</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Ready to Get Started?</CardTitle>
              <CardDescription>
                Join our partner network or sign in to your existing account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="px-8 py-3 text-lg w-full sm:w-auto">
                    Create Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="px-8 py-3 text-lg w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Or skip registration and try our onboarding process
                </p>
                <Link href="/onboarding">
                  <Button variant="ghost" className="text-sm">
                    Start Demo Onboarding →
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
