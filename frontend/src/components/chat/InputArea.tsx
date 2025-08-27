/**
 * Chat input area component with message composition and send functionality
 */
import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InputAreaProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function InputArea({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type your message...",
  className 
}: InputAreaProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
      resetTextareaHeight()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 120 // Max height in pixels
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [message])

  return (
    <div className={cn("border-t bg-background p-4", className)}>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2">
          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0 mb-1"
            disabled={disabled}
            onClick={() => {
              // TODO: Implement file attachment
              console.log('Attach file')
            }}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "w-full min-h-[44px] max-h-[120px] px-4 py-3 pr-12 rounded-lg border border-input bg-background text-sm resize-none",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "scrollbar-thin"
              )}
              rows={1}
            />
            
            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8"
              disabled={disabled || !message.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Settings button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0 mb-1"
            disabled={disabled}
            onClick={() => {
              // TODO: Implement chat settings
              console.log('Open settings')
            }}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Character count and hints */}
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
          <div className="flex items-center gap-2">
            {message.length > 0 && (
              <span className={cn(
                message.length > 2000 ? "text-destructive" : ""
              )}>
                {message.length}/2000
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
