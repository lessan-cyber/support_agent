// app/dashboard/documents/components/document-card.tsx
"use client"

import * as React from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.js"
import "react-pdf/dist/Page/TextLayer.js"
import {
  FileText,
  Download,
  Trash2,
  MoreVertical,
  Eye,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDistanceToNow } from "date-fns"

// Worker pdfjs — requis avec Next.js (App Router)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Document {
  id: string
  filename: string
  file_size: number
  created_at: string
  download_url: string
}

interface DocumentCardProps {
  document: Document
  onDownload: (document: Document) => void
  onDelete: (documentId: string) => void
  // onRename: (documentId: string, newName: string) => void
  // onShare: (documentId: string) => void
  onPreview: (document: Document) => void
}

function PdfThumbnail({ url }: { url: string }) {
  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(200)

  // Mesure la largeur réelle du conteneur pour que la page s'ajuste
  React.useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">

      {/* Fallback si erreur (CORS, token expiré…) */}
      {status === "error" && (
        <div className="flex flex-col items-center gap-2">
          <FileText className="h-14 w-14 text-red-400" />
          <span className="text-xs text-muted-foreground">Aperçu indisponible</span>
        </div>
      )}

      {/* Rendu réel de la 1ère page via react-pdf */}
      <Document
        file={url}
        onLoadSuccess={() => setStatus("success")}
        onLoadError={() => setStatus("error")}
        loading={null}
        className={status === "success" ? "block" : "hidden"}
      >
        <Page
          pageNumber={1}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  )
}

export function DocumentCard({
  document,
  onDownload,
  onDelete,
  onPreview,
}: DocumentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "—"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const formatDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return "Recently"
    }
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          {/* PDF Preview Thumbnail */}
          <div
            className="aspect-5/4 rounded-lg mb-3 relative overflow-hidden bg-muted"
            onClick={() => onPreview(document)}
          >
            <PdfThumbnail url={document.download_url} />

            {/* Overlay hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
            </div>
          </div>

          {/* Document Info */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm truncate flex-1" title={document.filename}>
                {document.filename}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPreview(document)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDownload(document)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatFileSize(document.file_size)}</span>
              <span>{formatDate(document.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {document.filename}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(document.id)
                setShowDeleteDialog(false)
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}