/**
 * Document uploader component with drag and drop functionality
 */
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useDocumentStore } from '@/stores/documentStore'
import { apiService } from '@/services/api'
import { cn, formatFileSize } from '@/lib/utils'

interface FileWithProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export function DocumentUploader() {
  const [uploadingFiles, setUploadingFiles] = useState<FileWithProgress[]>([])
  const { addDocument, setError } = useDocumentStore()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: FileWithProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }))

    setUploadingFiles(prev => [...prev, ...newFiles])

    // Upload files one by one
    for (let i = 0; i < newFiles.length; i++) {
      const fileWithProgress = newFiles[i]
      
      try {
        // Update status to uploading
        setUploadingFiles(prev => prev.map(f => 
          f.file === fileWithProgress.file 
            ? { ...f, status: 'uploading' }
            : f
        ))

        // Upload with progress tracking
        const response = await apiService.uploadDocumentWithProgress(
          fileWithProgress.file,
          (progress) => {
            setUploadingFiles(prev => prev.map(f => 
              f.file === fileWithProgress.file 
                ? { ...f, progress }
                : f
            ))
          }
        )

        // Mark as completed
        setUploadingFiles(prev => prev.map(f => 
          f.file === fileWithProgress.file 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ))

        // Add to document store
        addDocument(response.document)

        // Remove from uploading list after delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.file !== fileWithProgress.file))
        }, 2000)

      } catch (error) {
        console.error('Upload failed:', error)
        const errorMessage = apiService.handleApiError(error)
        
        setUploadingFiles(prev => prev.map(f => 
          f.file === fileWithProgress.file 
            ? { ...f, status: 'error', error: errorMessage }
            : f
        ))
      }
    }
  }, [addDocument])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/csv': ['.csv']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true
  })

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file))
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-primary/5",
          isDragActive && "border-primary bg-primary/10",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className={cn(
            "w-8 h-8 text-muted-foreground",
            isDragActive && "text-primary"
          )} />
          <div className="text-sm">
            {isDragActive ? (
              <p className="text-primary font-medium">Drop files here...</p>
            ) : (
              <>
                <p className="font-medium">Drop files here or click to browse</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Supports PDF, DOCX, TXT, MD, CSV (max 5MB each)
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Uploading files */}
      <AnimatePresence>
        {uploadingFiles.map((fileWithProgress) => (
          <motion.div
            key={fileWithProgress.file.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="border rounded-lg p-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {fileWithProgress.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                ) : (
                  <File className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">
                    {fileWithProgress.file.name}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeUploadingFile(fileWithProgress.file)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span>{formatFileSize(fileWithProgress.file.size)}</span>
                  <span>•</span>
                  <span className={cn(
                    fileWithProgress.status === 'completed' && "text-green-600",
                    fileWithProgress.status === 'error' && "text-destructive"
                  )}>
                    {fileWithProgress.status === 'pending' && 'Waiting...'}
                    {fileWithProgress.status === 'uploading' && 'Uploading...'}
                    {fileWithProgress.status === 'completed' && 'Completed'}
                    {fileWithProgress.status === 'error' && 'Failed'}
                  </span>
                </div>

                {fileWithProgress.status === 'uploading' && (
                  <Progress value={fileWithProgress.progress} className="h-1" />
                )}

                {fileWithProgress.status === 'error' && fileWithProgress.error && (
                  <p className="text-xs text-destructive mt-1">
                    {fileWithProgress.error}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
