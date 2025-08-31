/**
 * WebSocket service for real-time chat communication
 */
// import { io, Socket } from 'socket.io-client' // Not used - using native WebSocket
import { WebSocketMessage, Message, Conversation } from '@/types'

export interface WebSocketCallbacks {
  onMessage?: (message: Message) => void
  onTypingStart?: () => void
  onTypingStop?: () => void
  onError?: (error: string) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onConversationUpdate?: (conversation: Conversation) => void
}

class WebSocketService {
  private socket: WebSocket | null = null
  private callbacks: WebSocketCallbacks = {}
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private sessionId: string | null = null
  private isConnecting = false

  connect(sessionId: string, callbacks: WebSocketCallbacks = {}) {
    // Prevent multiple concurrent connection attempts
    if (this.isConnecting) {
      console.log('WebSocket connection already in progress')
      return
    }

    // Disconnect existing connection if it exists
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      console.log('Closing existing WebSocket connection')
      this.socket.close(1000, 'Reconnecting')
    }

    this.sessionId = sessionId
    this.callbacks = callbacks
    this.isConnecting = true

    try {
      const wsUrl = this.getWebSocketUrl(sessionId)
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        this.isConnecting = false
        this.callbacks.onConnect?.()
      }

      this.socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        this.isConnecting = false
        this.callbacks.onDisconnect?.()
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect()
        }
      }

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.isConnecting = false
        this.callbacks.onError?.('WebSocket connection error')
      }

    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.isConnecting = false
      this.callbacks.onError?.('Failed to establish WebSocket connection')
    }
  }

  private handleMessage(data: WebSocketMessage) {
    
    if (data.type === 'chat_response') {
      if (data.message && typeof data.message === 'object' && Object.keys(data.message).length > 0) {
        this.callbacks.onMessage?.(data.message as Message)
      }
      
      if (data.conversation) {
        this.callbacks.onConversationUpdate?.(data.conversation)
      }
    } else if (data.type === 'typing') {
      if (data.status === 'started') {
        this.callbacks.onTypingStart?.()
      } else if (data.status === 'stopped') {
        this.callbacks.onTypingStop?.()
      }
    } else if (data.type === 'error') {
      this.callbacks.onError?.(typeof data.message === 'string' ? data.message : 'Unknown error occurred')
    }
  }

  sendMessage(
    message: string,
    conversationId?: number,
    options: {
      useRag?: boolean
      maxTokens?: number
      temperature?: number
    } = {}
  ) {
    console.log('🔄 WebSocket sendMessage called:', { message, conversationId, options })
    
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected:', {
        socket: !!this.socket,
        readyState: this.socket?.readyState,
        connectionState: this.getConnectionState()
      })
      throw new Error('WebSocket is not connected')
    }

    const payload = {
      type: 'chat_message',
      message,
      conversation_id: conversationId,
      use_rag: options.useRag ?? true,
      max_tokens: options.maxTokens,
      temperature: options.temperature
    }

    console.log('📤 Sending WebSocket payload:', payload)
    
    try {
      this.socket.send(JSON.stringify(payload))
      console.log('✅ WebSocket payload sent successfully')
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error)
      throw error
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect')
      this.socket = null
    }
    this.sessionId = null
    this.callbacks = {}
    this.reconnectAttempts = 0
    this.isConnecting = false
  }

  private attemptReconnect() {
    if (!this.sessionId) return

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`)

    setTimeout(() => {
      if (this.sessionId) {
        this.connect(this.sessionId, this.callbacks)
      }
    }, delay)
  }

  private getWebSocketUrl(sessionId: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // Use dynamic backend port from environment variable or fallback to 8000
    const backendPort = (import.meta as any).env?.VITE_BACKEND_PORT || '8000'
    const host = window.location.hostname + ':' + backendPort
    return `${protocol}//${host}/api/v1/chat/ws/${sessionId}`
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected'
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'disconnected'
      default:
        return 'unknown'
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService()
export default webSocketService
