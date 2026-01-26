// app/dashboard/documents/components/pdf-preview-modal.tsx
"use client"

import * as React from "react"
import { X, Download, Maximize2, Minimize2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Document {
  id: string
  filename: string
  size: number
  uploaded_at: string
  url: string
}

interface PdfPreviewModalProps {
  document: Document | null
  onClose: () => void
}

export function PdfPreviewModal({ document, onClose }: PdfPreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  if (!document) return null

  const handleDownload = async () => {
    try {
      const response = await fetch(document.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement("a")
      a.href = url
      a.download = document.filename
      window.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      window.document.body.removeChild(a)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  return (
    <Dialog open={!!document} onOpenChange={onClose}>
      <DialogContent 
        className={`${isFullscreen ? "max-w-[95vw] h-[95vh]" : "max-w-4xl h-[80vh]"} p-0 gap-0`}
      >
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-base font-medium truncate pr-4">
            {document.filename}
          </DialogTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 w-full h-full overflow-hidden">
          <iframe
            src={`${document.url}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            title={document.filename}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}