/**
 * Component to display list of conversations/chat history
 */
import { useEffect, useState } from 'react'
import { MessageSquare, Trash2, Calendar, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChatStore } from '@/stores/chatStore'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'
import { apiService } from '@/services/api'

interface ConversationListProps {
  className?: string
}

export function ConversationList({ className }: ConversationListProps) {
  const { 
    conversations, 
    currentConversation, 
    setConversations, 
    setCurrentConversation, 
    removeConversation,
    updateConversation,
    setMessages 
  } = useChatStore()
  const { setCurrentView } = useAppStore()
  
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Load conversations on component mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await apiService.getConversations()
      setConversations(response.conversations || [])
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const handleSelectConversation = async (conversation: any) => {
    try {
      setCurrentConversation(conversation)
      
      // Load messages for this conversation
      const response = await apiService.getConversationHistory(conversation.id)
      setMessages(response.messages || [])
      
      // Switch to chat view
      setCurrentView('chat')
    } catch (error) {
      console.error('Failed to load conversation messages:', error)
    }
  }

  const handleDeleteConversation = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      await apiService.deleteConversation(conversationId)
      removeConversation(conversationId)
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const handleStartEdit = (conversation: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(conversation.id)
    setEditingTitle(conversation.title || 'Untitled Conversation')
  }

  const handleSaveEdit = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      await apiService.updateConversationTitle(conversationId, editingTitle)
      updateConversation(conversationId, { title: editingTitle })
      setEditingId(null)
      setEditingTitle('')
    } catch (error) {
      console.error('Failed to update conversation title:', error)
    }
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
    setEditingTitle('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (conversations.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-muted-foreground", className)}>
        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Start a new chat to begin</p>
      </div>
    )
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-4 space-y-2">
        <h3 className="font-medium text-sm mb-3 text-foreground">Recent Conversations</h3>
        
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              "group relative p-3 rounded-lg border cursor-pointer transition-colors",
              "hover:bg-accent hover:border-accent-foreground/20",
              "border-border/50",
              currentConversation?.id === conversation.id && "bg-accent border-accent-foreground/20"
            )}
            onClick={() => handleSelectConversation(conversation)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {editingId === conversation.id ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(conversation.id, e as any)
                        } else if (e.key === 'Escape') {
                          handleCancelEdit(e as any)
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleSaveEdit(conversation.id, e)}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <h4 className="font-medium text-sm truncate text-foreground">
                    {conversation.title || 'Untitled Conversation'}
                  </h4>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-foreground/70">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(conversation.created_at)}</span>
                  <span>•</span>
                  <span>{conversation.total_messages || 0} messages</span>
                </div>
              </div>
              
              {editingId !== conversation.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleStartEdit(conversation, e)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
