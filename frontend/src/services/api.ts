/**
 * API service for communicating with the Chat RAG backend
 */
import axios, { AxiosInstance } from 'axios'
import {
  Document,
  DocumentUploadResponse,
  DocumentListResponse,
  ChatRequest,
  ChatResponse,
  ConversationListResponse,
  ChatHistoryResponse,
  SearchResponse,
  ProcessingStatus
} from '@/types'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: '/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add any auth headers here if needed
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // Health endpoints
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/health')
    return response.data
  }

  async getDetailedHealth(): Promise<any> {
    const response = await this.api.get('/health/detailed')
    return response.data
  }

  async getSystemStats(): Promise<any> {
    const response = await this.api.get('/health/stats')
    return response.data
  }

  // Document endpoints
  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async getDocuments(
    page: number = 1,
    size: number = 20,
    statusFilter?: ProcessingStatus
  ): Promise<DocumentListResponse> {
    const params: any = { page, size }
    if (statusFilter) {
      params.status_filter = statusFilter
    }

    const response = await this.api.get('/documents/list', { params })
    return response.data
  }

  async getDocument(documentId: number): Promise<Document> {
    const response = await this.api.get(`/documents/${documentId}`)
    return response.data
  }

  async getDocumentStatus(documentId: number): Promise<any> {
    const response = await this.api.get(`/documents/${documentId}/status`)
    return response.data
  }

  async deleteDocument(documentId: number): Promise<void> {
    await this.api.delete(`/documents/${documentId}`)
  }

  async reindexDocuments(documentIds?: number[]): Promise<any> {
    const response = await this.api.post('/documents/reindex', {
      document_ids: documentIds
    })
    return response.data
  }

  async searchDocuments(
    query: string,
    documentIds?: number[],
    maxResults: number = 10
  ): Promise<SearchResponse> {
    const params: any = { query, max_results: maxResults }
    if (documentIds && documentIds.length > 0) {
      params.document_ids = documentIds
    }

    const response = await this.api.get('/documents/search/semantic', { params })
    return response.data
  }

  // Chat endpoints
  async sendMessage(chatRequest: ChatRequest): Promise<ChatResponse> {
    const response = await this.api.post('/chat/send', chatRequest)
    return response.data
  }

  async getConversations(
    page: number = 1,
    size: number = 20
  ): Promise<ConversationListResponse> {
    const response = await this.api.get('/chat/conversations', {
      params: { page, size }
    })
    return response.data
  }

  async getConversationHistory(conversationId: number): Promise<ChatHistoryResponse> {
    const response = await this.api.get(`/chat/conversations/${conversationId}/history`)
    return response.data
  }

  async deleteConversation(conversationId: number): Promise<void> {
    await this.api.delete(`/chat/conversations/${conversationId}`)
  }

  async updateConversationTitle(conversationId: number, title: string): Promise<void> {
    await this.api.put(`/chat/conversations/${conversationId}`, { title })
  }

  // File upload with progress
  async uploadDocumentWithProgress(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
    return response.data
  }

  // Batch operations
  async uploadMultipleDocuments(
    files: File[],
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<DocumentUploadResponse[]> {
    const results: DocumentUploadResponse[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const result = await this.uploadDocumentWithProgress(file, (progress) => {
          onProgress?.(i, progress)
        })
        results.push(result)
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        throw error
      }
    }

    return results
  }

  async deleteMultipleDocuments(documentIds: number[]): Promise<void> {
    const promises = documentIds.map(id => this.deleteDocument(id))
    await Promise.all(promises)
  }

  // Utility methods
  getWebSocketUrl(sessionId: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // Use dynamic backend port from environment variable or fallback to 8000
    const backendPort = (import.meta as any).env?.VITE_BACKEND_PORT || '8000'
    const host = window.location.hostname + ':' + backendPort
    return `${protocol}//${host}/api/v1/chat/ws/${sessionId}`
  }

  // Error handling helper
  handleApiError(error: any): string {
    if (error.response?.data?.detail) {
      return error.response.data.detail
    }
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.message) {
      return error.message
    }
    return 'An unexpected error occurred'
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService
