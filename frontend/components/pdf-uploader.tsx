// components/pdf-uploader.tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { FileUp, File, X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {toast} from "sonner"
import { uploadDocument } from "@/app/actions/upload_document"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function PdfUploader() {
  const router = useRouter()
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)

  const onDrop = React.useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === "file-too-large") {
        setError("File size must be less than 10MB")
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        setError("Only PDF files are allowed")
      } else {
        setError("Invalid file. Please try again.")
      }
      return
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    multiple: false,
  })

  const removeFile = () => {
    setFile(null)
    setError(null)
    setProgress(0)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setProgress(0)

    const formData = new FormData()
    formData.append("file", file)

    try {
      // Simulation de progression (à adapter selon votre API)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const data = await uploadDocument(formData)

      clearInterval(progressInterval)
      setProgress(100)

      toast.success("Your document has been uploaded successfully.")

      // Redirection vers la page des documents
      setTimeout(() => {
        router.push("/dashboard/documents")
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
      setProgress(0)
      
      toast.error("Failed to upload document. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Upload PDF Document</h2>
        <p className="text-sm text-muted-foreground">
          Upload a PDF file (max 10MB) to your document library
        </p>
      </div>

      {!file ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            ${error ? "border-destructive" : ""}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <FileUp className={`h-10 w-10 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragActive ? "Drop your PDF here" : "Drag & drop your PDF here"}
              </p>
              <p className="text-xs text-muted-foreground">or click to browse files</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Maximum file size: 10MB</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
            <File className="h-8 w-8 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {!uploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={removeFile}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            removeFile()
            // Fermer le dialog
          }}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload Document"
          )}
        </Button>
      </div>
    </div>
  )
}