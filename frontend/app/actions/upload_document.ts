'use server'

import { createClient } from '@/utils/supabase/server'

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/documents/upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error('Upload failed')
  }

  return response.json()
}
