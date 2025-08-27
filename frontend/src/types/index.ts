// API Response Types
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
}

// Document Types
export interface Document {
  id: number
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  mime_type?: string
  is_processed: boolean
  processing_status: ProcessingStatus
  error_message?: string
  content_preview?: string
  chunk_count: number
  word_count: number
  vector_store_id?: string
  embedding_model: string
  created_at: string
  updated_at?: string
  processed_at?: string
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface DocumentUploadResponse {
  message: string
  document: Document
  upload_id: string
}

export interface DocumentListResponse {
  documents: Document[]
  total: number
  page: number
  size: number
  has_next: boolean
  has_prev: boolean
}

// Chat Types
export interface Message {
  id: number
  conversation_id: number
  content: string
  role: MessageRole
  message_type: MessageType
  sources_used?: SourceDocument[]
  context_chunks?: string[]
  relevance_score?: string
  tokens_used?: number
  processing_time?: string
  model_used?: string
  created_at: string
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  ERROR = 'error'
}

export interface SourceDocument {
  document_id: number
  filename: string
  chunk_id: string
  relevance_score: number
  content_snippet: string
}

export interface Conversation {
  id: number
  session_id: string
  title?: string
  total_messages: number
  is_active: boolean
  created_at: string
  updated_at?: string
  last_message_at?: string
}

export interface ChatRequest {
  message: string
  conversation_id?: number
  session_id?: string
  use_rag?: boolean
  max_tokens?: number
  temperature?: number
}

export interface ChatResponse {
  message: Message
  conversation: Conversation
  processing_info: {
    tokens_used: number
    processing_time: string
    sources_count: number
    relevance_score: string
  }
}

export interface ConversationListResponse {
  conversations: Conversation[]
  total: number
  page: number
  size: number
  has_next: boolean
  has_prev: boolean
}

export interface ChatHistoryResponse {
  conversation: Conversation
  messages: Message[]
  total_messages: number
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'chat_message' | 'chat_response' | 'typing' | 'error'
  message?: string | Message
  conversation?: Conversation
  processing_info?: any
  status?: string
  error?: string
}

// UI State Types
export interface ChatState {
  messages: Message[]
  conversations: Conversation[]
  currentConversation?: Conversation
  isLoading: boolean
  isTyping: boolean
  error?: string
  sessionId: string
}

export interface DocumentState {
  documents: Document[]
  isUploading: boolean
  uploadProgress: number
  error?: string
  selectedDocuments: number[]
}

export interface AppState {
  sidebarOpen: boolean
  darkMode: boolean
  currentView: 'chat' | 'documents' | 'settings'
}

// Component Props Types
export interface MessageBubbleProps {
  message: Message
  isUser: boolean
  showSources?: boolean
}

export interface DocumentItemProps {
  document: Document
  onDelete?: (id: number) => void
  onSelect?: (id: number) => void
  selected?: boolean
}

export interface FileUploadProps {
  onUpload: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number
}

// Search and Filter Types
export interface SearchFilters {
  query?: string
  document_ids?: number[]
  status_filter?: ProcessingStatus
  date_from?: string
  date_to?: string
}

export interface SearchResult {
  document_id: number
  filename: string
  chunk_id: string
  content: string
  relevance_score: number
  chunk_index: number
}

export interface SearchResponse {
  results: SearchResult[]
  total_results: number
  query: string
}
