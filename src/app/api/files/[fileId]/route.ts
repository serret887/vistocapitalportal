import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest, createServerSupabaseClient } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ fileId: string }>
}

// DELETE /api/files/[fileId] - Delete a file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { fileId } = await params
    const { user, error: userError } = await getCurrentUserFromRequest(request)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const serverSupabase = createServerSupabaseClient()

    // Get partner profile
    const { data: partnerProfile, error: partnerError } = await serverSupabase
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

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('application_id')
    const documentType = searchParams.get('document_type')

    if (!applicationId || !documentType) {
      return NextResponse.json(
        { error: 'Application ID and document type are required' },
        { status: 400 }
      )
    }

    // Get the application to find the file
    const { data: application, error: appError } = await serverSupabase
      .from('loan_applications')
      .select('income_documents, bank_statements')
      .eq('id', applicationId)
      .eq('partner_id', partnerProfile.id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Find the file in the appropriate array
    let fileToDelete: any = null
    let updatedDocuments: any[] = []

    if (documentType === '1040_tax_return' || documentType.includes('income')) {
      fileToDelete = application.income_documents?.find((doc: any) => doc.id === fileId)
      updatedDocuments = application.income_documents?.filter((doc: any) => doc.id !== fileId) || []
    } else {
      fileToDelete = application.bank_statements?.find((doc: any) => doc.id === fileId)
      updatedDocuments = application.bank_statements?.filter((doc: any) => doc.id !== fileId) || []
    }

    if (!fileToDelete) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Delete file from storage
      const { error: storageError } = await serverSupabase.storage
        .from('loan-documents')
      .remove([fileToDelete.path])

      if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      return NextResponse.json(
        { error: 'Failed to delete file from storage' },
        { status: 500 }
      )
    }

    // Update the application's document array
    const updateData: any = {}
    if (documentType === '1040_tax_return' || documentType.includes('income')) {
      updateData.income_documents = updatedDocuments
    } else {
      updateData.bank_statements = updatedDocuments
    }

    const { error: updateError } = await serverSupabase
      .from('loan_applications')
      .update(updateData)
      .eq('id', applicationId)
      .eq('partner_id', partnerProfile.id)

    if (updateError) {
      console.error('Error updating application documents:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in DELETE /api/files/[fileId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 