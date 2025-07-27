import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, Users, TrendingUp, Shield, Calculator, FileText } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-visto-light via-white to-visto-light">
      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-visto-subtle text-visto-dark-gold px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4" />
            Join 500+ Real Estate Partners
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold visto-dark-blue mb-6 leading-tight">
            The Complete
            <span className="text-visto-gold block">Real Estate Partner</span>
            Platform
          </h1>
          
          <p className="text-xl md:text-2xl visto-slate mb-8 max-w-3xl mx-auto leading-relaxed">
            Streamline your real estate business with our comprehensive platform featuring DSCR calculators, 
            loan applications, and automated workflows. Join the network that's transforming real estate lending.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button size="lg" className="px-8 py-4 text-lg bg-visto-gold hover:bg-visto-dark-gold text-white">
                Sign Up Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-visto-gold text-visto-gold hover:bg-visto-gold hover:text-white">
                Sign In
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm visto-slate">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-visto-gold" />
              Sign up is free
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-visto-gold" />
              Setup in 5 minutes
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-visto-gold" />
              No credit card required
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-gradient-visto-subtle rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-visto-gold" />
            </div>
            <h3 className="text-xl font-semibold mb-3 visto-dark-blue">DSCR Calculator</h3>
            <p className="text-visto-slate">Advanced Debt Service Coverage Ratio calculator with real-time rate analysis and multiple loan product options.</p>
          </div>
          
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-gradient-visto-subtle rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-visto-gold" />
            </div>
            <h3 className="text-xl font-semibold mb-3 visto-dark-blue">Loan Applications</h3>
            <p className="text-visto-slate">Streamlined loan application process with automated validation and real-time status tracking.</p>
          </div>
          
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-gradient-visto-subtle rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-visto-gold" />
            </div>
            <h3 className="text-xl font-semibold mb-3 visto-dark-blue">Real-time Pricing</h3>
            <p className="text-visto-slate">Get instant loan pricing and rate quotes to close deals faster than ever before.</p>
          </div>
        </div>

        {/* Partner Types */}
        <div className="mt-20 text-center">
          <h2 className="text-4xl font-bold visto-dark-blue mb-4">
            Built for Every Real Estate Professional
          </h2>
          <p className="text-xl visto-slate max-w-2xl mx-auto mb-12">
            Whether you're a wholesaler, investor, or real estate agent, our platform adapts to your needs.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-visto-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-visto-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-3 visto-dark-blue">Wholesalers</h3>
              <p className="text-visto-slate">Access exclusive deals and streamline your wholesale operations with advanced tools.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-visto-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-visto-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-3 visto-dark-blue">Investors</h3>
              <p className="text-visto-slate">Build your real estate portfolio with our investment opportunities and analysis tools.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-visto-subtle rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-visto-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-3 visto-dark-blue">Real Estate Agents</h3>
              <p className="text-visto-slate">Expand your client base and increase your commission potential with our platform.</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center bg-gradient-to-r from-visto-dark-blue to-visto-dark-gold rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Real Estate Business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of successful real estate professionals who trust Visto Capital Partner Portal 
            to grow their business and streamline their operations.
          </p>
          
          <Link href="/signup">
            <Button size="lg" className="px-8 py-4 text-lg bg-white text-visto-dark-blue hover:bg-gray-100">
              Sign Up Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          
          <div className="flex items-center justify-center gap-8 text-blue-100 text-sm mt-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Sign up is free
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              No setup fees
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Instant access
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
