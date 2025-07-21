import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
]

// POST /api/upload - Handle file uploads
export async function POST(request: NextRequest) {
  try {
    // Get current user
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('document_type') as string
    const applicationId = formData.get('application_id') as string

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPEG, PNG, and WebP files are allowed.' },
        { status: 400 }
      )
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      )
    }

    // Validate application ownership if applicationId is provided
    if (applicationId) {
      const { data: application, error: appError } = await supabase
        .from('loan_applications')
        .select('id')
        .eq('id', applicationId)
        .eq('partner_id', partnerProfile.id)
        .single()

      if (appError || !application) {
        return NextResponse.json(
          { error: 'Application not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${partnerProfile.id}/${timestamp}-${randomId}.${fileExtension}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('loan-documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('loan-documents')
      .getPublicUrl(fileName)

    // Prepare file metadata
    const fileMetadata = {
      id: crypto.randomUUID(),
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      file_url: urlData.publicUrl,
      storage_path: fileName,
      uploaded_at: new Date().toISOString(),
      partner_id: partnerProfile.id,
      application_id: applicationId || null
    }

    // If this is associated with an application, update the application's documents
    if (applicationId) {
      // Determine if this is an income document or bank statement
      const isIncomeDocument = ['w2', 'self_employed', 'alimony', 'ssn', 'company', '1040_tax_return'].includes(documentType)
      
      if (isIncomeDocument) {
        // Add to income_documents array
        const { error: updateError } = await supabase
          .from('loan_applications')
          .update({
            income_documents: supabase.sql`income_documents || ${JSON.stringify([fileMetadata])}`
          })
          .eq('id', applicationId)
          .eq('partner_id', partnerProfile.id)

        if (updateError) {
          console.error('Error updating income documents:', updateError)
          // Still return success since file was uploaded
        }
      } else {
        // Add to bank_statements array
        const { error: updateError } = await supabase
          .from('loan_applications')
          .update({
            bank_statements: supabase.sql`bank_statements || ${JSON.stringify([fileMetadata])}`
          })
          .eq('id', applicationId)
          .eq('partner_id', partnerProfile.id)

        if (updateError) {
          console.error('Error updating bank statements:', updateError)
          // Still return success since file was uploaded
        }
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileMetadata.id,
        name: fileMetadata.file_name,
        size: fileMetadata.file_size,
        type: documentType,
        url: fileMetadata.file_url,
        uploaded_at: fileMetadata.uploaded_at
      },
      message: 'File uploaded successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 