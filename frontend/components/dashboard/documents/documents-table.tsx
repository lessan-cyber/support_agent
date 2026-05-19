// app/dashboard/components/documents/documents-table.tsx
"use client"

import * as React from "react"
import { Document, Page, pdfjs } from "react-pdf"
import {
  FileText,
  Download,
  Trash2,
  // Edit,
  // Share2,
  Eye,
  MoreHorizontal,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
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

interface DocumentsTableProps {
  documents: Document[]
  onDownload: (document: Document) => void
  onDelete: (documentId: string) => void
  // onRename: (documentId: string, newName: string) => void
  // onShare: (documentId: string) => void
  onPreview: (document: Document) => void
}

export function DocumentsTable({
  documents,
  onDownload,
  onDelete,
  onPreview,
}: DocumentsTableProps) {
    const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading")
    const [width, setWidth] = React.useState(30)
  const [deleteDocumentId, setDeleteDocumentId] = React.useState<string | null>(null)
  // const [renameDocument, setRenameDocument] = React.useState<Document | null>(null)
  // const [newName, setNewName] = React.useState("")

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const formatDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    } catch {
      return "Recently"
    }
  }

  // const handleRename = () => {
  //   if (renameDocument && newName && newName !== renameDocument.filename) {
  //     onRename(renameDocument.id, newName)
  //   }
  //   setRenameDocument(null)
  //   setNewName("")
  // }

  const deleteDoc = documents.find((d) => d.id === deleteDocumentId)

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                  {/* Fallback si erreur (CORS, token expiré…) */}
                        {status === "error" && (
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-5 w-5 text-red-400" />
                            <span className="text-xs text-muted-foreground">Aperçu indisponible</span>
                          </div>
                        )}
                  
                        {/* Rendu réel de la 1ère page via react-pdf */}
                        <Document
                          file={document.download_url}
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
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{document.filename}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatFileSize(document.file_size)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(document.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onPreview(document)}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDownload(document)}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
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
                        {/* <DropdownMenuItem
                          onClick={() => {
                            setRenameDocument(document)
                            setNewName(document.filename)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onShare(document.id)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem> */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteDocumentId(document.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteDocumentId}
        onOpenChange={(open) => !open && setDeleteDocumentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteDoc?.filename}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDocumentId) {
                  onDelete(deleteDocumentId)
                  setDeleteDocumentId(null)
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      {/* <Dialog
        open={!!renameDocument}
        onOpenChange={(open) => !open && setRenameDocument(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
            <DialogDescription>Enter a new name for your document.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new filename"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDocument(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </>
  )
}