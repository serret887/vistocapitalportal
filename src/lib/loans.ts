import { Loan, LoanFormData } from '@/types'
import { apiClient } from './api-client'

// Get all loans for an application
export async function getLoans(applicationId: string): Promise<{ loans: Loan[]; error?: string }> {
  try {
    const response = await apiClient.get<{ loans: Loan[] }>(`/applications/${applicationId}/loans`)
    
    if (response.error) {
      return { loans: [], error: response.error }
    }

    return { loans: response.data?.loans || [] }
  } catch (error) {
    console.error('Error fetching loans:', error)
    return { loans: [], error: 'Failed to fetch loans' }
  }
}

// Get a specific loan
export async function getLoan(applicationId: string, loanId: string): Promise<{ loan: Loan | null; error?: string }> {
  try {
    const response = await apiClient.get<{ loan: Loan }>(`/applications/${applicationId}/loans/${loanId}`)
    
    if (response.error) {
      return { loan: null, error: response.error }
    }

    return { loan: response.data?.loan || null }
  } catch (error) {
    console.error('Error fetching loan:', error)
    return { loan: null, error: 'Failed to fetch loan' }
  }
}

// Create a new loan
export async function createLoan(applicationId: string, loanData: LoanFormData): Promise<{ loan: Loan | null; error?: string }> {
  try {
    console.log('createLoan - applicationId:', applicationId)
    console.log('createLoan - loanData:', loanData)
    const response = await apiClient.post<{ loan: Loan }>(`/applications/${applicationId}/loans`, loanData)
    console.log('createLoan - API response:', response)
    
    if (response.error) {
      return { loan: null, error: response.error }
    }

    return { loan: response.data?.loan || null }
  } catch (error) {
    console.error('Error creating loan:', error)
    return { loan: null, error: 'Failed to create loan' }
  }
}

// Update a loan
export async function updateLoan(applicationId: string, loanId: string, loanData: Partial<LoanFormData>): Promise<{ loan: Loan | null; error?: string }> {
  try {
    const response = await apiClient.put<{ loan: Loan }>(`/applications/${applicationId}/loans/${loanId}`, loanData)
    
    if (response.error) {
      return { loan: null, error: response.error }
    }

    return { loan: response.data?.loan || null }
  } catch (error) {
    console.error('Error updating loan:', error)
    return { loan: null, error: 'Failed to update loan' }
  }
}

// Delete a loan
export async function deleteLoan(applicationId: string, loanId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/applications/${applicationId}/loans/${loanId}`)
    
    if (response.error) {
      return { success: false, error: response.error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting loan:', error)
    return { success: false, error: 'Failed to delete loan' }
  }
}

// Delete all loans by applicationId
export async function deleteLoansByApplicationId(applicationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/applications/${applicationId}/loans`)
    
    if (response.error) {
      return { success: false, error: response.error }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting all loans:', error)
    return { success: false, error: 'Failed to delete all loans' }
  }
}

// Helper function to create loan from DSCR data
export function createLoanFromDscrData(dscrData: any, loanName: string): LoanFormData {
  return {
    loan_name: loanName,
    loan_type: 'DSCR',
    loan_objective: dscrData.loan_objective || 'purchase',
    property_address: dscrData.property_address || '',
    property_type: dscrData.property_type || '',
    property_state: dscrData.property_state || '',
    property_zip_code: dscrData.propertyZipCode || '',
    property_city: dscrData.propertyCity || '',
    property_occupancy: dscrData.propertyOccupancy || 'Investment',
    estimated_home_value: dscrData.estimated_home_value || 0,
    purchase_price: dscrData.propertyPurchasePrice || dscrData.estimated_home_value || 0,
    loan_amount: dscrData.loan_amount || 0,
    down_payment_amount: 0, // Calculate based on loan amount and purchase price
    down_payment_percentage: dscrData.down_payment_percentage || 0,
    closing_costs: dscrData.propertyClosingCosts || 0,
    seller_concessions: dscrData.propertySellerConcessions || 0,
    repairs_improvements: dscrData.propertyRepairsImprovements || 0,
    reserves: dscrData.propertyReserves || 0,
    monthly_rental_income: dscrData.monthly_rental_income || 0,
    annual_property_insurance: dscrData.annual_property_insurance || 0,
    annual_property_taxes: dscrData.annual_property_taxes || 0,
    monthly_hoa_fee: dscrData.monthly_hoa_fee || 0,
    monthly_mortgage_payment: 0, // Calculate based on loan terms
    noi: dscrData.dscr_results?.noi || 0,
    dscr_ratio: dscrData.dscr_results?.dscr || 0,
    cash_flow: dscrData.dscr_results?.cashFlow || 0,
    interest_rate: dscrData.selected_loan?.rate || 0,
    loan_term_years: dscrData.selected_loan?.term || 30,
    prepayment_penalty: dscrData.prepaymentPenalty || '',
    discount_points: dscrData.discountPoints || 0,
    fico_score_range: dscrData.ficoScoreRange || '',
    broker_points: dscrData.broker_points || 0,
    broker_admin_fee: dscrData.broker_admin_fee || 0,
    broker_ysp: dscrData.broker_ysp || 0,
    lender_name: dscrData.selected_loan?.lender || '',
    loan_product: dscrData.selected_loan?.product || '',
    selected_loan_product: dscrData.selected_loan || null,
    flood_insurance: dscrData.propertyFloodInsurance || 0,
    hazard_insurance: dscrData.propertyHazardInsurance || dscrData.annual_property_insurance || 0,
    title_insurance: dscrData.propertyTitleInsurance || 0,
    survey_fees: dscrData.propertySurveyFees || 0,
    recording_fees: dscrData.propertyRecordingFees || 0,
    transfer_taxes: dscrData.propertyTransferTaxes || 0,
    other_costs: dscrData.propertyOtherCosts || 0,
    is_short_term_rental: dscrData.is_short_term_rental || false,
    escrow_accounts: dscrData.propertyEscrowAccounts || false,
    loan_data: dscrData,
    notes: `Created from DSCR calculator data`
  }
} 