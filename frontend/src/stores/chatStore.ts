/**
 * Zustand store for chat state management
 */
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Message, Conversation, ChatState } from '@/types'
import { generateSessionId } from '@/lib/utils'

interface ChatStore extends ChatState {
  // Actions
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: number, updates: Partial<Message>) => void
  removeMessage: (messageId: number) => void
  clearMessages: () => void
  
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (conversationId: number, updates: Partial<Conversation>) => void
  removeConversation: (conversationId: number) => void
  setCurrentConversation: (conversation: Conversation | undefined) => void
  
  setLoading: (loading: boolean) => void
  setTyping: (typing: boolean) => void
  setError: (error: string | undefined) => void
  
  // Computed getters
  getCurrentMessages: () => Message[]
  getConversationById: (id: number) => Conversation | undefined
  getMessagesByConversation: (conversationId: number) => Message[]
  
  // Actions
  startNewConversation: () => void
  resetState: () => void
}

const initialState: ChatState = {
  messages: [],
  conversations: [],
  currentConversation: undefined,
  isLoading: false,
  isTyping: false,
  error: undefined,
  sessionId: generateSessionId()
}

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Message actions
        setMessages: (messages) => set({ messages }),
        
        addMessage: (message) => set((state) => ({
          messages: [...state.messages, message]
        })),
        
        updateMessage: (messageId, updates) => set((state) => ({
          messages: state.messages.map(msg => 
            msg.id === messageId ? { ...msg, ...updates } : msg
          )
        })),
        
        removeMessage: (messageId) => set((state) => ({
          messages: state.messages.filter(msg => msg.id !== messageId)
        })),
        
        clearMessages: () => set({ messages: [] }),

        // Conversation actions
        setConversations: (conversations) => set({ conversations }),
        
        addConversation: (conversation) => set((state) => ({
          conversations: [conversation, ...state.conversations]
        })),
        
        updateConversation: (conversationId, updates) => set((state) => ({
          conversations: state.conversations.map(conv => 
            conv.id === conversationId ? { ...conv, ...updates } : conv
          ),
          currentConversation: state.currentConversation?.id === conversationId 
            ? { ...state.currentConversation, ...updates } 
            : state.currentConversation
        })),
        
        removeConversation: (conversationId) => set((state) => ({
          conversations: state.conversations.filter(conv => conv.id !== conversationId),
          currentConversation: state.currentConversation?.id === conversationId 
            ? undefined 
            : state.currentConversation,
          messages: state.currentConversation?.id === conversationId 
            ? [] 
            : state.messages
        })),
        
        setCurrentConversation: (conversation) => set({ 
          currentConversation: conversation,
          messages: [] // Clear messages when switching conversations
        }),

        // UI state actions
        setLoading: (isLoading) => set({ isLoading }),
        setTyping: (isTyping) => set({ isTyping }),
        setError: (error) => set({ error }),

        // Computed getters
        getCurrentMessages: () => {
          const state = get()
          if (!state.currentConversation) return []
          return state.messages.filter(msg => 
            msg.conversation_id === state.currentConversation!.id
          )
        },
        
        getConversationById: (id) => {
          return get().conversations.find(conv => conv.id === id)
        },
        
        getMessagesByConversation: (conversationId) => {
          return get().messages.filter(msg => msg.conversation_id === conversationId)
        },

        // Utility actions
        startNewConversation: () => set({
          currentConversation: undefined,
          messages: [],
          sessionId: generateSessionId()
        }),
        
        resetState: () => set({
          ...initialState,
          sessionId: generateSessionId()
        })
      }),
      {
        name: 'chat-store',
        partialize: (state) => ({
          conversations: state.conversations,
          currentConversation: state.currentConversation,
          sessionId: state.sessionId
        })
      }
    ),
    { name: 'ChatStore' }
  )
)
