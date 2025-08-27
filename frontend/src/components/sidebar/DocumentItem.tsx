/**
 * Individual document item component for the sidebar
 */
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  File, 
  FileText, 
  Trash2, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Document, ProcessingStatus } from '@/types'
import { cn, formatFileSize, formatDate } from '@/lib/utils'

interface DocumentItemProps {
  document: Document
  onDelete?: (id: number) => void
  onSelect?: (id: number) => void
  selected?: boolean
  showDetails?: boolean
}

export function DocumentItem({ 
  document, 
  onDelete, 
  onSelect, 
  selected = false,
  showDetails = false 
}: DocumentItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const getStatusIcon = () => {
    switch (document.processing_status) {
      case ProcessingStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case ProcessingStatus.PROCESSING:
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case ProcessingStatus.FAILED:
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusText = () => {
    switch (document.processing_status) {
      case ProcessingStatus.COMPLETED:
        return 'Processed'
      case ProcessingStatus.PROCESSING:
        return 'Processing...'
      case ProcessingStatus.FAILED:
        return 'Failed'
      default:
        return 'Pending'
    }
  }

  const getFileIcon = () => {
    const extension = document.file_type.toLowerCase()
    if (extension === '.pdf') {
      return <FileText className="w-4 h-4 text-red-500" />
    }
    if (['.doc', '.docx'].includes(extension)) {
      return <FileText className="w-4 h-4 text-blue-500" />
    }
    if (['.txt', '.md'].includes(extension)) {
      return <FileText className="w-4 h-4 text-gray-500" />
    }
    if (extension === '.csv') {
      return <FileText className="w-4 h-4 text-green-500" />
    }
    return <File className="w-4 h-4 text-muted-foreground" />
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(document.id)
    }
    setShowDeleteDialog(false)
  }

  const handleSelect = () => {
    if (onSelect) {
      onSelect(document.id)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "group border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm",
          selected && "border-primary bg-primary/5",
          document.processing_status === ProcessingStatus.FAILED && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10"
        )}
        onClick={handleSelect}
      >
        <div className="flex items-start gap-3">
          {/* File icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getFileIcon()}
          </div>

          {/* Document info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h4 className="text-sm font-medium truncate pr-2">
                {document.original_filename}
              </h4>
              
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDetailsDialog(true)
                  }}
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Status and metadata */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              {getStatusIcon()}
              <span>{getStatusText()}</span>
              <span>•</span>
              <span>{formatFileSize(document.file_size)}</span>
            </div>

            {/* Processing progress */}
            {document.processing_status === ProcessingStatus.PROCESSING && (
              <Progress value={50} className="h-1 mb-2" />
            )}

            {/* Error message */}
            {document.processing_status === ProcessingStatus.FAILED && document.error_message && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {document.error_message}
              </p>
            )}

            {/* Success info */}
            {document.processing_status === ProcessingStatus.COMPLETED && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{document.chunk_count} chunks</span>
                <span>•</span>
                <span>{document.word_count} words</span>
              </div>
            )}

            {/* Upload date */}
            <div className="text-xs text-muted-foreground mt-1">
              {formatDate(document.created_at)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{document.original_filename}"? 
              This action cannot be undone and will remove the document from your knowledge base.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon()}
              {document.original_filename}
            </DialogTitle>
            <DialogDescription>
              Document details and processing information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">File Size:</span>
                <span className="ml-2">{formatFileSize(document.file_size)}</span>
              </div>
              <div>
                <span className="font-medium">File Type:</span>
                <span className="ml-2">{document.file_type}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2 flex items-center gap-1">
                  {getStatusIcon()}
                  {getStatusText()}
                </span>
              </div>
              <div>
                <span className="font-medium">Uploaded:</span>
                <span className="ml-2">{formatDate(document.created_at)}</span>
              </div>
            </div>

            {/* Processing info */}
            {document.processing_status === ProcessingStatus.COMPLETED && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Processing Results</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Chunks:</span>
                    <span className="ml-2">{document.chunk_count}</span>
                  </div>
                  <div>
                    <span className="font-medium">Words:</span>
                    <span className="ml-2">{document.word_count}</span>
                  </div>
                  <div>
                    <span className="font-medium">Processed:</span>
                    <span className="ml-2">
                      {document.processed_at ? formatDate(document.processed_at) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Model:</span>
                    <span className="ml-2">{document.embedding_model}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Content preview */}
            {document.content_preview && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Content Preview</h4>
                <div className="bg-muted p-3 rounded-md text-sm max-h-32 overflow-y-auto">
                  {document.content_preview}
                </div>
              </div>
            )}

            {/* Error details */}
            {document.processing_status === ProcessingStatus.FAILED && document.error_message && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 text-red-600">Error Details</h4>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-sm text-red-700 dark:text-red-300">
                  {document.error_message}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
