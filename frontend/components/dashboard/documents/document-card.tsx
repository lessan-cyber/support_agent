// app/dashboard/documents/components/document-card.tsx
"use client"

import * as React from "react"
import { 
  FileText, 
  Download, 
  Trash2, 
  MoreVertical, 
  Edit, 
  Share2,
  Eye
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Document, formatFileSize, formatDate } from "@/lib/document-utils"

interface DocumentCardProps {
  document: Document
  onDownload: (document: Document) => void
  onDelete: (documentId: string) => void
  onRename: (documentId: string, newName: string) => void
  onShare: (documentId: string) => void
  onPreview: (document: Document) => void
}

export function DocumentCard({
  document,
  onDownload,
  onDelete,
  onRename,
  onShare,
  onPreview,
}: DocumentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [showRenameDialog, setShowRenameDialog] = React.useState(false)
  const [newName, setNewName] = React.useState(document.filename)
  const [nameError, setNameError] = React.useState(false)

  React.useEffect(() => {
    setNewName(document.filename)
  }, [document.filename])

  const handleRename = () => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === document.filename) {
      setNameError(true)
      return
    }
    setNameError(false)
    onRename(document.id, trimmed)
    setShowRenameDialog(false)
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          {/* PDF Preview Thumbnail */}
          <div 
            className="aspect-[3/4] bg-gradient-to-br from-red-50 to-red-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden"
            onClick={() => onPreview(document)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-red-200/50" />
            <FileText className="h-16 w-16 text-red-600 relative z-10" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  <DropdownMenuItem onClick={() => { setNameError(false); setShowRenameDialog(true) }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare(document.id)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
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
              <span>{formatFileSize(document.size)}</span>
              <span>{formatDate(document.uploaded_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.filename}"? This action cannot be undone.
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

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
            <DialogDescription>
              Enter a new name for your document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setNameError(false) }}
                onKeyDown={(e) => { if (e.key === "Enter") handleRename() }}
                placeholder="Enter new filename"
              />
              {nameError && <p className="text-xs text-destructive">Filename cannot be empty or unchanged</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim() || newName.trim() === document.filename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}