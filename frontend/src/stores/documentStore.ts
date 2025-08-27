/**
 * Zustand store for document state management
 */
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Document, DocumentState, ProcessingStatus } from '@/types'

interface DocumentStore extends DocumentState {
  // Actions
  setDocuments: (documents: Document[]) => void
  addDocument: (document: Document) => void
  updateDocument: (documentId: number, updates: Partial<Document>) => void
  removeDocument: (documentId: number) => void
  clearDocuments: () => void
  
  setUploading: (uploading: boolean) => void
  setUploadProgress: (progress: number) => void
  setError: (error: string | undefined) => void
  
  setSelectedDocuments: (documentIds: number[]) => void
  toggleDocumentSelection: (documentId: number) => void
  clearSelection: () => void
  
  // Computed getters
  getDocumentById: (id: number) => Document | undefined
  getProcessedDocuments: () => Document[]
  getPendingDocuments: () => Document[]
  getFailedDocuments: () => Document[]
  getSelectedDocuments: () => Document[]
  
  // Statistics
  getDocumentStats: () => {
    total: number
    processed: number
    pending: number
    failed: number
    processing: number
  }
}

const initialState: DocumentState = {
  documents: [],
  isUploading: false,
  uploadProgress: 0,
  error: undefined,
  selectedDocuments: []
}

export const useDocumentStore = create<DocumentStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Document actions
      setDocuments: (documents) => set({ documents }),
      
      addDocument: (document) => set((state) => ({
        documents: [document, ...state.documents]
      })),
      
      updateDocument: (documentId, updates) => set((state) => ({
        documents: state.documents.map(doc => 
          doc.id === documentId ? { ...doc, ...updates } : doc
        )
      })),
      
      removeDocument: (documentId) => set((state) => ({
        documents: state.documents.filter(doc => doc.id !== documentId),
        selectedDocuments: state.selectedDocuments.filter(id => id !== documentId)
      })),
      
      clearDocuments: () => set({ documents: [], selectedDocuments: [] }),

      // Upload state actions
      setUploading: (isUploading) => set({ isUploading }),
      setUploadProgress: (uploadProgress) => set({ uploadProgress }),
      setError: (error) => set({ error }),

      // Selection actions
      setSelectedDocuments: (selectedDocuments) => set({ selectedDocuments }),
      
      toggleDocumentSelection: (documentId) => set((state) => {
        const isSelected = state.selectedDocuments.includes(documentId)
        return {
          selectedDocuments: isSelected
            ? state.selectedDocuments.filter(id => id !== documentId)
            : [...state.selectedDocuments, documentId]
        }
      }),
      
      clearSelection: () => set({ selectedDocuments: [] }),

      // Computed getters
      getDocumentById: (id) => {
        return get().documents.find(doc => doc.id === id)
      },
      
      getProcessedDocuments: () => {
        return get().documents.filter(doc => 
          doc.processing_status === ProcessingStatus.COMPLETED
        )
      },
      
      getPendingDocuments: () => {
        return get().documents.filter(doc => 
          doc.processing_status === ProcessingStatus.PENDING
        )
      },
      
      getFailedDocuments: () => {
        return get().documents.filter(doc => 
          doc.processing_status === ProcessingStatus.FAILED
        )
      },
      
      getSelectedDocuments: () => {
        const { documents, selectedDocuments } = get()
        return documents.filter(doc => selectedDocuments.includes(doc.id))
      },

      // Statistics
      getDocumentStats: () => {
        const documents = get().documents
        return {
          total: documents.length,
          processed: documents.filter(d => d.processing_status === ProcessingStatus.COMPLETED).length,
          pending: documents.filter(d => d.processing_status === ProcessingStatus.PENDING).length,
          failed: documents.filter(d => d.processing_status === ProcessingStatus.FAILED).length,
          processing: documents.filter(d => d.processing_status === ProcessingStatus.PROCESSING).length
        }
      }
    }),
    { name: 'DocumentStore' }
  )
)
