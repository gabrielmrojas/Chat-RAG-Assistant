/**
 * Main chat interface component
 */
import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { InputArea } from './InputArea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/stores/chatStore'
import { useDocumentStore } from '@/stores/documentStore'
import { webSocketService } from '@/services/websocket'
import { apiService } from '@/services/api'
import { Message, MessageRole, MessageType } from '@/types'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  className?: string
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected')
  
  const {
    messages,
    currentConversation,
    isLoading,
    isTyping,
    error,
    sessionId,
    addMessage,
    updateConversation,
    setCurrentConversation,
    setLoading,
    setTyping,
    setError,
    getCurrentMessages
  } = useChatStore()

  const { getSelectedDocuments } = useDocumentStore()

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      webSocketService.connect(sessionId, {
        onConnect: () => {
          setConnectionStatus('connected')
          setError(undefined)
        },
        onDisconnect: () => {
          setConnectionStatus('disconnected')
        },
        onMessage: (message: Message) => {
          // Fix conversation_id mismatch - use currentConversation.id if available
          const conversationId = currentConversation?.id || message.conversation_id || 1
          const correctedMessage = {
            ...message,
            conversation_id: conversationId
          }
          
          addMessage(correctedMessage)
          setTyping(false)
          setLoading(false)
        },
        onTypingStart: () => {
          setTyping(true)
        },
        onTypingStop: () => {
          setTyping(false)
        },
        onError: (error: string) => {
          setError(error)
          setTyping(false)
          setLoading(false)
        },
        onConversationUpdate: (conversation) => {
          updateConversation(conversation.id, conversation)
          
          // Set as current conversation if none exists
          if (!currentConversation) {
            setCurrentConversation(conversation)
          }
        }
      })
    }

    connectWebSocket()

    return () => {
      webSocketService.disconnect()
    }
  }, [sessionId])

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return

    try {
      setLoading(true)
      setError(undefined)

      // Create user message
      const userMessage: Message = {
        id: Date.now(),
        conversation_id: currentConversation?.id || 0,
        content: messageContent,
        role: MessageRole.USER,
        message_type: MessageType.TEXT,
        created_at: new Date().toISOString()
      }

      // Add user message immediately
      addMessage(userMessage)
      
      if (webSocketService.isConnected()) {
        webSocketService.sendMessage(
          messageContent,
          currentConversation?.id,
          {
            useRag: true
          }
        )
      } else {
        const response = await apiService.sendMessage({
          message: messageContent,
          conversation_id: currentConversation?.id,
          session_id: sessionId,
          use_rag: true
        })

        console.log('📥 REST API response:', response)
        addMessage(response.message)
        if (response.conversation) {
          updateConversation(response.conversation.id, response.conversation)
        }
        setLoading(false)
        console.log('✅ REST API message processed successfully')
      }

    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error)
      console.error('Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        cause: (error as any)?.cause
      })
      setError(apiService.handleApiError(error))
      setLoading(false)
    }
  }

  const handleRetry = () => {
    if (connectionStatus === 'disconnected') {
      webSocketService.connect(sessionId, {
        onConnect: () => setConnectionStatus('connected'),
        onDisconnect: () => setConnectionStatus('disconnected'),
        onError: (error) => setError(error)
      })
    }
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    // TODO: Show toast notification
  }

  const currentMessages = getCurrentMessages()
  const hasMessages = currentMessages.length > 0

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Connection status */}
      {connectionStatus !== 'connected' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="w-4 h-4" />
              <span>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connection lost. Using fallback mode.'}
              </span>
            </div>
            {connectionStatus === 'disconnected' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2">
          <div className="flex items-center gap-2 max-w-4xl mx-auto text-sm text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(undefined)}
              className="ml-auto h-6 px-2 text-xs"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {!hasMessages && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-muted-foreground">AI</span>
                </div>
                <h2 className="text-xl font-semibold mb-2">Welcome to Chat RAG Assistant</h2>
                <p className="text-muted-foreground max-w-md">
                  Ask questions about your uploaded documents or start a general conversation. 
                  I'll use your documents to provide more accurate and contextual responses.
                </p>
              </div>
            )}

            <div className="space-y-6 pb-4">
              <AnimatePresence>
                {currentMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onCopy={handleCopyMessage}
                  />
                ))}
              </AnimatePresence>

              {isTyping && <TypingIndicator />}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Input area */}
      <InputArea
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder={
          currentConversation 
            ? "Continue the conversation..." 
            : "Start a new conversation..."
        }
      />
    </div>
  )
}
