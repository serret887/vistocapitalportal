'use client'

import { BorrowerApplicationForm } from '@/components/dashboard/borrower-application-form'
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
      <BorrowerApplicationForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
} 