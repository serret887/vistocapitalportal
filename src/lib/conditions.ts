import { supabase } from './supabase'
import type { ApplicationCondition, ConditionActivity, ConditionType } from '@/types'

// Create default conditions for a new application
export async function createDefaultConditions(applicationId: string, bankAccountsCount: number = 0) {
  const conditions: Array<{
    application_id: string
    title: string
    description: string
    condition_type: ConditionType
    fee_amount?: number
  }> = [
    {
      application_id: applicationId,
      title: 'Credit Authorization',
      description: 'Get authorization from the client to pull their credit report. This is required to proceed with the loan application.',
      condition_type: 'credit_authorization'
    },
    {
      application_id: applicationId,
      title: 'Bank Statements',
      description: `Upload 2 months of bank statements for each account listed in the application. You have ${bankAccountsCount} account(s) that require statements.`,
      condition_type: 'bank_statements'
    },
    {
      application_id: applicationId,
      title: 'Insurance Documentation',
      description: 'Upload insurance documentation for the new application. This includes property insurance and any required coverage.',
      condition_type: 'insurance'
    },
    {
      application_id: applicationId,
      title: 'Application Fee Payment',
      description: 'Collect application, credit, and appraisal fee. This is a $1,200 upfront fee required to process your application.',
      condition_type: 'application_fee',
      fee_amount: 1200
    }
  ]

  try {
    const { data, error } = await supabase
      .from('application_conditions')
      .insert(conditions)
      .select()

    if (error) {
      console.error('Error creating conditions:', error)
      throw error
    }

    // Create initial activity for each condition
    const activities = data.map(condition => ({
      condition_id: condition.id,
      activity_type: 'created',
      message: 'This condition was added to the application'
    }))

    await supabase
      .from('condition_activities')
      .insert(activities)

    return { conditions: data, error: null }
  } catch (error) {
    console.error('Error creating default conditions:', error)
    return { conditions: null, error: error as Error }
  }
}

// Get conditions for an application
export async function getApplicationConditions(applicationId: string) {
  try {
    const { data: conditions, error: conditionsError } = await supabase
      .from('application_conditions')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true })

    if (conditionsError) {
      throw conditionsError
    }

    // Get activities for each condition
    const conditionsWithActivities = await Promise.all(
      conditions.map(async (condition) => {
        const { data: activities, error: activitiesError } = await supabase
          .from('condition_activities')
          .select('*')
          .eq('condition_id', condition.id)
          .order('created_at', { ascending: false })

        if (activitiesError) {
          console.error('Error fetching activities for condition:', condition.id, activitiesError)
        }

        return {
          ...condition,
          activities: activities || []
        }
      })
    )

    return { conditions: conditionsWithActivities, error: null }
  } catch (error) {
    console.error('Error getting application conditions:', error)
    return { conditions: null, error: error as Error }
  }
}

// Update condition status
export async function updateConditionStatus(conditionId: string, status: string, message?: string) {
  try {
    const { data, error } = await supabase
      .from('application_conditions')
      .update({ status })
      .eq('id', conditionId)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Add activity log entry
    if (message) {
      await supabase
        .from('condition_activities')
        .insert({
          condition_id: conditionId,
          activity_type: 'status_updated',
          message
        })
    }

    return { condition: data, error: null }
  } catch (error) {
    console.error('Error updating condition status:', error)
    return { condition: null, error: error as Error }
  }
}

// Add activity to condition
export async function addConditionActivity(conditionId: string, activityType: string, message: string) {
  try {
    const { data, error } = await supabase
      .from('condition_activities')
      .insert({
        condition_id: conditionId,
        activity_type: activityType,
        message
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { activity: data, error: null }
  } catch (error) {
    console.error('Error adding condition activity:', error)
    return { activity: null, error: error as Error }
  }
} 