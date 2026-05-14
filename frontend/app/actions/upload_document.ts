'use server'

import { createClient } from '@/utils/supabase/server'

export interface UploadDocumentResponse {
  file_id: string
  filename: string
  status: string
  task_id: string
}

export interface DocumentItem {
  id: string
  filename: string
  created_at: string
  download_url: string
  file_size: number
  content_type: string
  tenant_id: string
}

export interface DocumentListResponse {
  documents: DocumentItem[]
  count: number
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json') && !contentType.includes('+json')) {
    const body = await response.text()
    throw new Error(`Expected JSON, got ${contentType} (${response.status}): ${body.slice(0, 500)}`)
  }
  return response.json()
}

export async function uploadDocument(
  formData: FormData
): Promise<UploadDocumentResponse> {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000)

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/documents/upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      let detail = 'Upload failed'
      try {
        const body = await response.json()
        if (body.message) detail = body.message
        else if (body.detail) detail = body.detail
        else if (body.errors?.length) detail = body.errors.join(', ')
      } catch {
        try { detail = await response.text() } catch {}
      }
      throw new Error(detail)
    }

    return parseJsonResponse<UploadDocumentResponse>(response)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Upload timed out after 2 minutes')
    }
    throw error
  }
}

export async function getDocuments(params: {
  page: number
  limit: number
  sort: string
  date_filter: string
  search: string
}): Promise<DocumentListResponse> {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    sort: params.sort,
    date_filter: params.date_filter,
    search: params.search,
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000)

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/documents?${queryParams}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Failed to fetch documents')
    }

    return parseJsonResponse<DocumentListResponse>(response)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw error
  }
}

// get all documents without pagination (for export)
export async function getAllDocuments(): Promise<DocumentListResponse> {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000)

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/documents`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Failed to fetch documents')
    }

    return parseJsonResponse<DocumentListResponse>(response)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw error
  }
}

export async function deleteDocument(documentId: string): Promise<Record<string, unknown>> {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000)

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/documents/${encodeURIComponent(documentId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Failed to delete document')
    }

    return parseJsonResponse<Record<string, unknown>>(response)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw error
  }
}

export async function updateDocument(
  documentId: string,
  data: { filename?: string }
): Promise<Record<string, unknown>> {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  if (data.filename !== undefined) {
    const sanitized = data.filename.trim()
    if (!sanitized) {
      throw new Error('Invalid filename')
    }
    if (sanitized.length > 255) {
      throw new Error('Invalid filename')
    }
    if (!/^[^\x00-\x1F\\\/:?*"<>|]+$/u.test(sanitized)) {
      throw new Error('Invalid filename: must not contain control characters or \\ / : ? * " < > |')
    }
    data.filename = sanitized
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000)

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/documents/${encodeURIComponent(documentId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Failed to update document')
    }

    return parseJsonResponse<Record<string, unknown>>(response)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out')
    }
    throw error
  }
}
