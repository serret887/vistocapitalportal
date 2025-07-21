import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
]

// POST /api/upload - Upload a file
export async function POST(request: NextRequest) {
  try {
    const { user, error: userError } = await getCurrentUserFromRequest(request)
    
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('document_type') as string
    const applicationId = formData.get('application_id') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and images are allowed' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${documentType}_${timestamp}.${fileExtension}`
    const filePath = `${partnerProfile.id}/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('loan-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('loan-documents')
      .getPublicUrl(filePath)

    // Create file record
    const fileRecord = {
      id: `${documentType}_${timestamp}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      path: filePath,
      uploaded_at: new Date().toISOString(),
      partner_id: partnerProfile.id,
      application_id: applicationId || null
    }

    // If application ID is provided, update the application's documents
    if (applicationId) {
      // Get current application
      const { data: application, error: appError } = await supabase
          .from('loan_applications')
        .select('income_documents, bank_statements')
          .eq('id', applicationId)
          .eq('partner_id', partnerProfile.id)
        .single()

      if (appError) {
        console.error('Error fetching application:', appError)
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        )
      }

      // Update the appropriate document array
      const updateData: any = {}
      if (documentType === '1040_tax_return' || documentType.includes('income')) {
        updateData.income_documents = [...(application.income_documents || []), fileRecord]
      } else {
        updateData.bank_statements = [...(application.bank_statements || []), fileRecord]
      }

        const { error: updateError } = await supabase
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
    }

    return NextResponse.json({
      success: true,
      file: fileRecord,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Unexpected error in POST /api/upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 