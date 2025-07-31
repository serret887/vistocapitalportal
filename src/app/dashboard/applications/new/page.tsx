'use client'

import { EnhancedApplicationForm } from '@/components/dashboard/enhanced-application-form'
import { useRouter } from 'next/navigation'

export default function NewBorrowerApplicationPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/dashboard/applications')
  }

  const handleCancel = () => {
    router.push('/dashboard/applications')
  }

  return (
    <div className="container mx-auto py-8">
      <EnhancedApplicationForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
} 