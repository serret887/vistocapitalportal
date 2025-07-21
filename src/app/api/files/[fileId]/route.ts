import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface RouteParams {
  params: {
    fileId: string
  }
}

// DELETE /api/files/[fileId] - Delete a file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Parse query parameters
    const url = new URL(request.url)
    const applicationId = url.searchParams.get('application_id')
    const documentType = url.searchParams.get('document_type')

    if (!applicationId || !documentType) {
      return NextResponse.json(
        { error: 'Application ID and document type are required' },
        { status: 400 }
      )
    }

    // Validate application ownership
    const { data: application, error: appError } = await supabase
      .from('loan_applications')
      .select('id, income_documents, bank_statements')
      .eq('id', applicationId)
      .eq('partner_id', partnerProfile.id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found or access denied' },
        { status: 404 }
      )
    }

    // Find the file in the appropriate document array
    const isIncomeDocument = ['w2', 'self_employed', 'alimony', 'ssn', 'company', '1040_tax_return'].includes(documentType)
    
    let fileToDelete = null
    let updatedDocuments = null

    if (isIncomeDocument) {
      const incomeDocuments = application.income_documents || []
      fileToDelete = incomeDocuments.find((doc: any) => doc.id === params.fileId)
      updatedDocuments = incomeDocuments.filter((doc: any) => doc.id !== params.fileId)
    } else {
      const bankStatements = application.bank_statements || []
      fileToDelete = bankStatements.find((doc: any) => doc.id === params.fileId)
      updatedDocuments = bankStatements.filter((doc: any) => doc.id !== params.fileId)
    }

    if (!fileToDelete) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Delete from Supabase Storage
    if (fileToDelete.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('loan-documents')
        .remove([fileToDelete.storage_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue with database update even if storage deletion fails
      }
    }

    // Update the application to remove the file reference
    const updateField = isIncomeDocument ? 'income_documents' : 'bank_statements'
    const { error: updateError } = await supabase
      .from('loan_applications')
      .update({
        [updateField]: updatedDocuments,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .eq('partner_id', partnerProfile.id)

    if (updateError) {
      console.error('Error updating application documents:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      deleted_file: {
        id: fileToDelete.id,
        name: fileToDelete.file_name,
        type: documentType
      }
    })

  } catch (error) {
    console.error('Unexpected error in DELETE /api/files/[fileId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 