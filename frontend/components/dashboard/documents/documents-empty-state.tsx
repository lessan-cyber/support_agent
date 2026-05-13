// app/dashboard/documents/components/documents-empty-state.tsx
import { FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DocumentsEmptyStateProps {
  onUploadClick: () => void
}

export function DocumentsEmptyState({ onUploadClick }: DocumentsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
      <div className="rounded-full bg-muted p-6 mb-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Get started by uploading your first PDF document. All your files will appear here.
      </p>
      <Button onClick={onUploadClick} size="lg">
        <Upload className="mr-2 h-4 w-4" />
        Upload Your First Document
      </Button>
    </div>
  )
}