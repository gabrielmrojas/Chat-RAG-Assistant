/**
 * Main sidebar component containing document management
 */
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, MessageSquare, Files } from 'lucide-react'
import { DocumentUploader } from './DocumentUploader'
import { DocumentList } from './DocumentList'
import { ConversationList } from './ConversationList'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAppStore } from '@/stores/appStore'
import { useChatStore } from '@/stores/chatStore'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { sidebarOpen, setSidebarOpen, currentView, setCurrentView } = useAppStore()
  const { startNewConversation } = useChatStore()

  const handleNewChat = () => {
    startNewConversation()
    setCurrentView('chat')
  }

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={sidebarOpen ? "open" : "closed"}
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 bg-background border-r",
          "lg:relative lg:z-auto lg:translate-x-0",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="font-semibold text-sm">Chat RAG</h1>
                <p className="text-xs text-muted-foreground">AI Assistant</p>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="p-4 border-b">
            <div className="flex gap-1">
              <Button
                variant={currentView === 'chat' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setCurrentView('chat')}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Chat
              </Button>
              <Button
                variant={currentView === 'documents' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setCurrentView('documents')}
              >
                <Files className="w-4 h-4 mr-1" />
                Documents
              </Button>
            </div>
            
            {/* New chat button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={handleNewChat}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Chat
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {currentView === 'documents' ? (
              <div className="h-full flex flex-col">
                {/* Upload section */}
                <div className="p-4 border-b">
                  <h3 className="font-medium mb-3 text-sm">Upload Documents</h3>
                  <DocumentUploader />
                </div>
                
                {/* Document list */}
                <DocumentList className="flex-1" />
              </div>
            ) : (
              <ConversationList className="flex-1" />
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <div className="flex items-center justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
