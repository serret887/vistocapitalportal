import { NextRequest, NextResponse } from 'next/server'

// GET /api/test - Simple health check for API routes
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API is working correctly',
    timestamp: new Date().toISOString(),
    endpoints: {
      applications: {
        'GET /api/applications': 'List all applications',
        'POST /api/applications': 'Create new application',
        'GET /api/applications/[id]': 'Get specific application',
        'PUT /api/applications/[id]': 'Update application',
        'DELETE /api/applications/[id]': 'Delete application',
        'PUT /api/applications/[id]/status': 'Update application status'
      },
      files: {
        'POST /api/upload': 'Upload file',
        'DELETE /api/files/[fileId]': 'Delete file'
      },
      dashboard: {
        'GET /api/dashboard/stats': 'Get dashboard statistics'
      }
    }
  })
} 