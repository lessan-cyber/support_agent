import { formatDistanceToNow } from "date-fns"

export interface Document {
  id: string
  filename: string
  size: number
  uploaded_at: string
  url: string
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
  return (bytes / (1024 * 1024)).toFixed(2) + " MB"
}

export function formatDate(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('formatDate: failed to parse date', { date, error })
    }
    return "Recently"
  }
}
