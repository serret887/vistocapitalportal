import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { DashboardStats, LoanApplicationStatus } from '@/types'

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { user, error: userError } = await getCurrentUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get partner profile
    const { data: partnerProfile, error: partnerError } = await supabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partnerProfile) {
      return NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 404 }
      )
    }

    // Get application counts by status
    const { data: statusCounts, error: statsError } = await supabase
      .from('loan_applications')
      .select('status')
      .eq('partner_id', partnerProfile.id)

    if (statsError) {
      console.error('Error fetching dashboard stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch dashboard statistics' },
        { status: 500 }
      )
    }

    // Calculate stats
    const stats: DashboardStats = {
      in_review: 0,
      approved: 0,
      ineligible: 0,
      denied: 0,
      closed: 0,
      missing_conditions: 0,
      pending_documents: 0,
      total: statusCounts?.length || 0
    }

    // Count applications by status
    statusCounts?.forEach((app: { status: LoanApplicationStatus }) => {
      if (app.status in stats) {
        stats[app.status as keyof DashboardStats] += 1
      }
    })

    return NextResponse.json({
      stats,
      success: true
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/dashboard/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 