// Test validation script for the new business rules system
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testBusinessRules() {
  console.log('🧪 Testing Business Rules Validation System\n')

  try {
    // Fetch the eligibility matrix
    const { data, error } = await supabase
      .from('eligibility_matrices')
      .select('*, lenders(*), pricing_matrices(*)')
      .eq('lenders.name', 'Visio')
      .single()

    if (error) {
      console.error('❌ Error fetching matrices:', error)
      return
    }

    console.log('✅ Successfully fetched matrices')
    console.log('📊 Lender:', data.lenders.name)
    console.log('📋 Program:', data.rules.program)
    console.log('🔧 Business Rules Categories:', Object.keys(data.rules.business_rules))
    
    // Check each rule category
    const businessRules = data.rules.business_rules
    
    console.log('\n📝 Business Rules Summary:')
    console.log('• State Rules:', businessRules.state_rules?.length || 0)
    console.log('• Loan Purpose Rules:', businessRules.loan_purpose_rules?.length || 0)
    console.log('• Prepayment Penalty Rules:', businessRules.prepayment_penalty_rules?.length || 0)
    console.log('• DSCR/LTV Rules:', businessRules.dscr_ltv_rules?.length || 0)
    console.log('• Product Rules:', businessRules.product_rules?.length || 0)
    console.log('• Rate Rules:', businessRules.rate_rules?.length || 0)

    // Check specific rules
    console.log('\n🔍 Detailed Rules:')
    
    // State rules
    console.log('\n📍 State Rules:')
    businessRules.state_rules?.forEach(rule => {
      console.log(`  • ${rule.rule_id}: ${rule.states.join(', ')} - ${rule.error_message}`)
    })

    // Loan purpose rules
    console.log('\n🎯 Loan Purpose Rules:')
    businessRules.loan_purpose_rules?.forEach(rule => {
      console.log(`  • ${rule.rule_id}: ${rule.error_message}`)
    })

    // Check base rates structure
    const pricingData = data.pricing_matrices[0]?.pricing_data
    if (pricingData?.base_rates?.tiers) {
      console.log('\n💰 Base Rate Tiers:')
      Object.keys(pricingData.base_rates.tiers).forEach(tier => {
        console.log(`  • ${tier}: ${Object.keys(pricingData.base_rates.tiers[tier]).length} LTV ranges`)
      })
    }

    // Check rate adjustments
    if (pricingData?.rate_structure) {
      console.log('\n⚙️ Rate Adjustments:')
      console.log('  • Products:', Object.keys(pricingData.rate_structure.products || {}).length)
      console.log('  • Origination Fees:', Object.keys(pricingData.rate_structure.origination_fee_adjustments || {}).length)
      console.log('  • Loan Sizes:', Object.keys(pricingData.rate_structure.loan_size_adjustments || {}).length)
      console.log('  • Prepayment Penalties:', Object.keys(pricingData.rate_structure.prepay_penalty_structures || {}).length)
    }

    console.log('\n✅ All business rules and pricing data loaded successfully!')

  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

testBusinessRules() 