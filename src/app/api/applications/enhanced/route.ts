import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/auth'
import { sendApplicationNotification } from '@/lib/slack-notifications'
import { createDefaultConditions } from '@/lib/conditions'
import type { EnhancedApplicationFormData } from '@/types'
import { 
  getCorrelationId, 
  logRequest, 
  logResponse, 
  logError, 
  logDebug,
  logWithCorrelation 
} from '@/lib/utils'

// POST /api/applications/enhanced - Create a new enhanced application
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Creating enhanced application')
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for enhanced application')
      
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Authentication required')
      return response
    }

    const serverSupabase = createServerSupabaseClient()

    // Get partner profile
    const { data: partnerProfile, error: partnerError } = await serverSupabase
      .from('partner_profiles')
      .select('id, first_name, last_name, email, phone_number')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partnerProfile) {
      logWithCorrelation(correlationId, 'warn', 'Partner profile not found', {
        error: partnerError?.message
      })
      
      const response = NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 404 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 404, 'Partner profile not found')
      return response
    }

    const formData: EnhancedApplicationFormData = await request.json()

    logWithCorrelation(correlationId, 'debug', 'Received form data', {
      applicationName: formData.application_name,
      hasCompany: formData.has_company,
      clientCount: formData.clients.length,
      clients: formData.clients.map(c => ({ name: `${c.first_name} ${c.last_name}`, email: c.email }))
    })

    // Basic validation
    if (!formData.application_name || formData.clients.length === 0) {
      logWithCorrelation(correlationId, 'warn', 'Missing required fields', {
        hasApplicationName: !!formData.application_name,
        clientCount: formData.clients.length
      })
      
      const response = NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 400, 'Missing required fields')
      return response
    }

    // Create application
    logWithCorrelation(correlationId, 'debug', 'Creating application record')
    
    const { data: application, error: applicationError } = await serverSupabase
      .from('applications')
      .insert({
        user_id: user.id,
        application_name: formData.application_name,
        application_type: formData.application_type,
        notes: formData.notes,
        status: 'in_review'
      })
      .select()
      .single()

    if (applicationError) {
      logWithCorrelation(correlationId, 'error', 'Failed to create application', {
        error: applicationError.message
      })
      
      const response = NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to create application')
      return response
    }

    // Create company if applicable
    let companyId: string | null = null
    if (formData.has_company && formData.company) {
      logWithCorrelation(correlationId, 'debug', 'Creating company record')
      
      const { data: company, error: companyError } = await serverSupabase
        .from('companies')
        .insert({
          user_id: user.id,
          company_name: formData.company.company_name,
          company_type: formData.company.company_type,
          ein: formData.company.ein,
          business_address: formData.company.business_address,
          business_phone: formData.company.business_phone,
          business_email: formData.company.business_email,
          industry: formData.company.industry,
          years_in_business: formData.company.years_in_business,
          annual_revenue: formData.company.annual_revenue,
          number_of_employees: formData.company.number_of_employees
        })
        .select()
        .single()

      if (companyError) {
        logWithCorrelation(correlationId, 'warn', 'Failed to create company', {
          error: companyError.message
        })
        // Don't fail the entire request if company creation fails
      } else {
        companyId = company.id
      }
    }

    // Create clients and link them to the application
    const clientIds: string[] = []
    
    for (let i = 0; i < formData.clients.length; i++) {
      const client = formData.clients[i]
      
      logWithCorrelation(correlationId, 'debug', `Creating client ${i + 1}`, {
        clientName: `${client.first_name} ${client.last_name}`
      })
      
      const { data: createdClient, error: clientError } = await serverSupabase
        .from('clients')
        .insert({
          user_id: user.id,
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          phone_number: client.phone_number,
          ssn: client.ssn,
          date_of_birth: client.date_of_birth,
          current_residence: client.current_residence,
          total_income: client.total_income,
          income_sources: client.income_sources,
          income_documents: client.income_documents,
          total_assets: client.total_assets,
          bank_accounts: client.bank_accounts,
          bank_statements: client.bank_statements
        })
        .select()
        .single()

      if (clientError) {
        logWithCorrelation(correlationId, 'error', `Failed to create client ${i + 1}`, {
          error: clientError.message,
          clientName: `${client.first_name} ${client.last_name}`
        })
        
        const response = NextResponse.json(
          { error: `Failed to create client ${client.first_name} ${client.last_name}` },
          { status: 500 }
        )
        response.headers.set('x-correlation-id', correlationId)
        logResponse(correlationId, 500, `Failed to create client ${i + 1}`)
        return response
      }

      clientIds.push(createdClient.id)

      // Link client to application
      const clientRole = i === 0 ? 'primary' : 'co_client'
      
      const { error: linkError } = await serverSupabase
        .from('client_applications')
        .insert({
          client_id: createdClient.id,
          application_id: application.id,
          client_role: clientRole
        })

      if (linkError) {
        logWithCorrelation(correlationId, 'error', `Failed to link client ${i + 1} to application`, {
          error: linkError.message,
          clientId: createdClient.id,
          applicationId: application.id
        })
        
        const response = NextResponse.json(
          { error: `Failed to link client ${client.first_name} ${client.last_name} to application` },
          { status: 500 }
        )
        response.headers.set('x-correlation-id', correlationId)
        logResponse(correlationId, 500, `Failed to link client ${i + 1}`)
        return response
      }

      // Link client to company if applicable
      if (companyId && client.has_company && client.company) {
        const { error: companyLinkError } = await serverSupabase
          .from('client_companies')
          .insert({
            client_id: createdClient.id,
            company_id: companyId,
            ownership_percentage: client.company.ownership_percentage,
            role_in_company: client.company.role_in_company
          })

        if (companyLinkError) {
          logWithCorrelation(correlationId, 'warn', `Failed to link client ${i + 1} to company`, {
            error: companyLinkError.message
          })
          // Don't fail the entire request if company link fails
        }
      }
    }

    // Create default conditions for the application
    try {
      const totalBankAccounts = formData.clients.reduce((total, client) => 
        total + (client.bank_accounts?.length || 0), 0)
      await createDefaultConditions(application.id, totalBankAccounts)
    } catch (conditionError) {
      logWithCorrelation(correlationId, 'warn', 'Failed to create conditions', {
        error: (conditionError as Error).message
      })
      // Don't fail the request if condition creation fails
    }

    // Send Slack notification
    try {
      await sendApplicationNotification(application, partnerProfile)
    } catch (notificationError) {
      logWithCorrelation(correlationId, 'warn', 'Failed to send Slack notification', {
        error: (notificationError as Error).message
      })
      // Don't fail the request if notification fails
    }

    logWithCorrelation(correlationId, 'info', 'Enhanced application created successfully', {
      applicationId: application.id,
      clientCount: clientIds.length,
      hasCompany: !!companyId
    })

    const response = NextResponse.json({
      application,
      clientIds,
      companyId,
      success: true,
      message: 'Enhanced application created successfully'
    })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 201, 'Enhanced application created successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/applications/enhanced POST' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 