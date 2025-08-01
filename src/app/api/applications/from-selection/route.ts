import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/auth'
import { 
  getCorrelationId, 
  logRequest, 
  logResponse, 
  logError, 
  logDebug,
  logWithCorrelation 
} from '@/lib/utils'

// POST /api/applications/from-selection - Create application from selected companies and clients
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for application creation')
      
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Authentication required')
      return response
    }

    const body = await request.json()
    const { companies, clients, application_name, application_type, notes } = body

    if (!companies && !clients) {
      logWithCorrelation(correlationId, 'warn', 'No companies or clients provided')
      
      const response = NextResponse.json(
        { error: 'At least one company or client is required' },
        { status: 400 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 400, 'No companies or clients provided')
      return response
    }

    const serverSupabase = createServerSupabaseClient()

    // Step 1: Create all clients first (both new and existing)
    const processedClientIds: string[] = []
    const newClients: any[] = []
    
    if (clients && clients.length > 0) {
      for (const client of clients) {
        if (typeof client === 'string') {
          // This is an existing client ID
          processedClientIds.push(client)
        } else if (client.id && client.id.startsWith('temp-')) {
          // This is a new client that needs to be created
          const { data: newClient, error: clientError } = await serverSupabase
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
            logWithCorrelation(correlationId, 'error', 'Failed to create client', {
              error: clientError.message,
              clientName: `${client.first_name} ${client.last_name}`
            })
            throw new Error(`Failed to create client: ${client.first_name} ${client.last_name}`)
          }

          processedClientIds.push(newClient.id)
          newClients.push(newClient)
        }
      }
    }

    // Step 2: Create all companies and link them to clients
    const processedCompanyIds: string[] = []
    
    if (companies && companies.length > 0) {
      for (const company of companies) {
        if (typeof company === 'string') {
          // This is an existing company ID
          processedCompanyIds.push(company)
        } else if (company.id && company.id.startsWith('temp-')) {
          // This is a new company that needs to be created
          const { data: newCompany, error: companyError } = await serverSupabase
            .from('companies')
            .insert({
              user_id: user.id,
              company_name: company.company_name,
              company_type: company.company_type,
              ein: company.ein,
              business_address: company.business_address,
              business_phone: company.business_phone,
              business_email: company.business_email,
              industry: company.industry,
              years_in_business: company.years_in_business,
              annual_revenue: company.annual_revenue,
              number_of_employees: company.number_of_employees
            })
            .select()
            .single()

          if (companyError) {
            logWithCorrelation(correlationId, 'error', 'Failed to create company', {
              error: companyError.message,
              companyName: company.company_name
            })
            throw new Error(`Failed to create company: ${company.company_name}`)
          }

          processedCompanyIds.push(newCompany.id)
        }
      }
    }

    // Step 3: Link clients to companies (if both exist)
    if (processedClientIds.length > 0 && processedCompanyIds.length > 0) {
      const clientCompanyLinks = []
      
      for (const clientId of processedClientIds) {
        for (const companyId of processedCompanyIds) {
          clientCompanyLinks.push({
            client_id: clientId,
            company_id: companyId,
            ownership_percentage: 100, // Default to 100% ownership
            role_in_company: 'Owner' // Default role
          })
        }
      }

      if (clientCompanyLinks.length > 0) {
        const { error: linkError } = await serverSupabase
          .from('client_companies')
          .insert(clientCompanyLinks)

        if (linkError) {
          logWithCorrelation(correlationId, 'error', 'Failed to link clients to companies', {
            error: linkError.message,
            clientCount: processedClientIds.length,
            companyCount: processedCompanyIds.length
          })
          // Don't throw error here, just log it
        } else {
          logWithCorrelation(correlationId, 'info', 'Successfully linked clients to companies', {
            clientCount: processedClientIds.length,
            companyCount: processedCompanyIds.length
          })
        }
      }
    }

        // Check for existing applications with the same clients
    let existingApplication = null
    if (processedClientIds.length > 0) {
      // First get all applications for this user
      const { data: userApps, error: userAppsError } = await serverSupabase
        .from('applications')
        .select('id, application_name')
        .eq('user_id', user.id)

      if (userAppsError) {
        logWithCorrelation(correlationId, 'error', 'Failed to get user applications', {
          error: userAppsError.message,
          userId: user.id
        })
      } else if (userApps && userApps.length > 0) {
        // Check if any of these applications have the same clients
        for (const app of userApps) {
          const { data: appClients, error: appClientsError } = await serverSupabase
            .from('client_applications')
            .select('client_id')
            .eq('application_id', app.id)

          if (!appClientsError && appClients) {
            const appClientIds = appClients.map((ca: any) => ca.client_id)
            const hasSameClients = processedClientIds.every((clientId: string) => appClientIds.includes(clientId)) &&
                                 appClientIds.length === processedClientIds.length
            
            if (hasSameClients) {
              existingApplication = app
              break
            }
          }
        }
      }
    }

    if (existingApplication) {
      logWithCorrelation(correlationId, 'warn', 'Application already exists', {
        existingApplicationId: existingApplication.id,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { 
          error: 'An application with these companies and clients already exists',
          existingApplicationId: existingApplication.id
        },
        { status: 409 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 409, 'Application already exists')
      return response
    }

    // Create the application
    const { data: application, error: appError } = await serverSupabase
      .from('applications')
      .insert({
        user_id: user.id,
        application_name: application_name || `Application - ${new Date().toLocaleDateString()}`,
        application_type: application_type || 'loan_application',
        notes: notes || '',
        status: 'in_review' // Changed from 'pending' to 'in_review' to match constraint
      })
      .select()
      .single()

    if (appError) {
      logWithCorrelation(correlationId, 'error', 'Failed to create application', {
        error: appError.message,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to create application')
      return response
    }

    // Companies are now linked to clients through client_companies table
    // No additional linking needed here

    // Link clients to the application
    if (processedClientIds.length > 0) {
      const clientLinks = processedClientIds.map((clientId: string) => ({
        application_id: application.id,
        client_id: clientId
      }))

      const { error: clientLinkError } = await serverSupabase
        .from('client_applications')
        .insert(clientLinks)

      if (clientLinkError) {
        logWithCorrelation(correlationId, 'error', 'Failed to link clients to application', {
          error: clientLinkError.message,
          applicationId: application.id
        })
      }
    }

    logWithCorrelation(correlationId, 'info', 'Application created successfully', {
      applicationId: application.id,
      userId: user.id,
      companiesCount: processedCompanyIds.length,
      clientsCount: processedClientIds.length
    })

    const response = NextResponse.json({
      success: true,
      application: application
    })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Application created successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/applications/from-selection POST' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 