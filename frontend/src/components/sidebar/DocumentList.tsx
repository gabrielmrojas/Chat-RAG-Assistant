/**
 * Document list component with filtering and selection
 */
import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Search, Filter, RefreshCw, Trash2, CheckSquare, Square } from 'lucide-react'
import { DocumentItem } from './DocumentItem'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDocumentStore } from '@/stores/documentStore'
import { apiService } from '@/services/api'
import { ProcessingStatus } from '@/types'
import { cn, debounce } from '@/lib/utils'

interface DocumentListProps {
  className?: string
}

export function DocumentList({ className }: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProcessingStatus | 'all'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)

  const {
    documents,
    selectedDocuments,
    error,
    setDocuments,
    removeDocument,
    setError,
    toggleDocumentSelection,
    clearSelection,
    getDocumentStats
  } = useDocumentStore()

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      setError(undefined)
      
      const response = await apiService.getDocuments(
        1, 
        100, 
        statusFilter === 'all' ? undefined : statusFilter
      )
      
      setDocuments(response.documents)
    } catch (error) {
      console.error('Error loading documents:', error)
      setError(apiService.handleApiError(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (documentId: number) => {
    try {
      await apiService.deleteDocument(documentId)
      removeDocument(documentId)
    } catch (error) {
      console.error('Error deleting document:', error)
      setError(apiService.handleApiError(error))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return

    try {
      setIsLoading(true)
      await apiService.deleteMultipleDocuments(selectedDocuments)
      
      selectedDocuments.forEach(id => removeDocument(id))
      clearSelection()
      setSelectionMode(false)
    } catch (error) {
      console.error('Error deleting documents:', error)
      setError(apiService.handleApiError(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadDocuments()
  }

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query)
  }, 300)

  // Filter documents based on search and status
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content_preview?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || doc.processing_status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = getDocumentStats()

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Documents</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
            {documents.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectionMode(!selectionMode)
                  if (selectionMode) clearSelection()
                }}
              >
                {selectionMode ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
          <div>Total: {stats.total}</div>
          <div>Processed: {stats.processed}</div>
          <div>Processing: {stats.processing}</div>
          <div>Failed: {stats.failed}</div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 overflow-x-auto">
          {[
            { value: 'all', label: 'All' },
            { value: ProcessingStatus.COMPLETED, label: 'Processed' },
            { value: ProcessingStatus.PROCESSING, label: 'Processing' },
            { value: ProcessingStatus.PENDING, label: 'Pending' },
            { value: ProcessingStatus.FAILED, label: 'Failed' }
          ].map(filter => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="sm"
              className="text-xs whitespace-nowrap"
              onClick={() => setStatusFilter(filter.value as ProcessingStatus | 'all')}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selectionMode && selectedDocuments.length > 0 && (
        <div className="p-3 bg-muted/50 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedDocuments.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(undefined)}
            className="mt-1 h-6 px-2 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Document list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading && documents.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {documents.length === 0 
                  ? "No documents uploaded yet" 
                  : "No documents match your filters"
                }
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredDocuments.map((document) => (
                <DocumentItem
                  key={document.id}
                  document={document}
                  onDelete={handleDelete}
                  onSelect={selectionMode ? toggleDocumentSelection : undefined}
                  selected={selectedDocuments.includes(document.id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
