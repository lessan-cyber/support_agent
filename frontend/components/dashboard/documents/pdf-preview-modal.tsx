// app/dashboard/documents/components/pdf-preview-modal.tsx
"use client"

import * as React from "react"
import { X, Download, Maximize2, Minimize2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import "react-pdf/dist/Page/AnnotationLayer.js"
import "react-pdf/dist/Page/TextLayer.js"

// Worker react-pdf (Next.js)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface DocumentItem {
  id: string
  filename: string
  file_size: number
  created_at: string
  download_url: string
}

interface PdfPreviewModalProps {
  document: DocumentItem | null
  onClose: () => void
}

export function PdfPreviewModal({ document, onClose }: PdfPreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [numPages, setNumPages] = React.useState<number>(0)
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [scale, setScale] = React.useState<number>(1.0)
  const [rotation, setRotation] = React.useState<number>(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Reset state when document changes
  React.useEffect(() => {
    if (document) {
      setCurrentPage(1)
      setScale(1.0)
      setRotation(0)
      setIsLoading(true)
      setError(null)
    }
  }, [document?.id])

  if (!document) return null

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }

  const onDocumentLoadError = (err: Error) => {
    setError("Impossible de charger le PDF.")
    setIsLoading(false)
    console.error("PDF load error:", err)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(document.download_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement("a")
      a.href = url
      a.download = document.filename
      window.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      window.document.body.removeChild(a)
    } catch (err) {
      console.error("Download failed:", err)
    }
  }

  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1))
  const goToNextPage = () => setCurrentPage((p) => Math.min(numPages, p + 1))
  const zoomIn = () => setScale((s) => Math.min(3, parseFloat((s + 0.25).toFixed(2))))
  const zoomOut = () => setScale((s) => Math.max(0.5, parseFloat((s - 0.25).toFixed(2))))
  const rotate = () => setRotation((r) => (r + 90) % 360)

  return (
    <Dialog open={!!document} onOpenChange={onClose}>
      <DialogContent
        className={`${isFullscreen ? "max-w-[95vw] h-[95vh]" : "max-w-4xl h-[85vh]"} p-0 gap-0 flex flex-col`}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0 shrink-0">
          <DialogTitle className="text-sm font-medium truncate pr-4 max-w-[40%]">
            {document.filename}
          </DialogTitle>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Zoom */}
            <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom arrière" disabled={scale <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom avant" disabled={scale >= 3}>
              <ZoomIn className="h-4 w-4" />
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Rotation */}
            <Button variant="ghost" size="icon" onClick={rotate} title="Pivoter">
              <RotateCw className="h-4 w-4" />
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Download */}
            <Button variant="ghost" size="icon" onClick={handleDownload} title="Télécharger">
              <Download className="h-4 w-4" />
            </Button>

            {/* Fullscreen */}
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            {/* Close */}
            <Button variant="ghost" size="icon" onClick={onClose} title="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-muted/40 flex items-start justify-center p-4">
          {error ? (
            <div className="flex items-center justify-center h-full text-sm text-destructive">
              {error}
            </div>
          ) : (
            <Document
              file={document.download_url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                  Chargement du PDF...
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                rotate={rotation}
                loading={
                  <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                    Chargement de la page...
                  </div>
                }
                className="shadow-lg"
              />
            </Document>
          )}
        </div>

        {/* Pagination Footer */}
        {!isLoading && !error && numPages > 0 && (
          <div className="shrink-0 border-t px-4 py-2 flex items-center justify-center gap-3 bg-background">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page <span className="font-medium text-foreground">{currentPage}</span> sur{" "}
              <span className="font-medium text-foreground">{numPages}</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}