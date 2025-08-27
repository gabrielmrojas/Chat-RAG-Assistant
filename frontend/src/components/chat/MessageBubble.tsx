/**
 * Message bubble component for displaying chat messages
 */
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import { Copy, ExternalLink, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import { Message, MessageRole, SourceDocument } from '@/types'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  showSources?: boolean
  onCopy?: (content: string) => void
}

export function MessageBubble({ message, showSources = true, onCopy }: MessageBubbleProps) {
  const isUser = message.role === MessageRole.USER
  const isAssistant = message.role === MessageRole.ASSISTANT
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false)

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content)
    } else {
      navigator.clipboard.writeText(message.content)
    }
  }

  const renderSources = () => {
    if (!showSources || !message.sources_used || message.sources_used.length === 0) {
      return null
    }

    return (
      <div className="mt-3 pt-3 border-t border-muted">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-xs text-muted-foreground mb-2 p-0 h-auto hover:bg-transparent"
          onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
        >
          {isSourcesExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          <FileText className="w-3 h-3" />
          <span>Sources ({message.sources_used.length})</span>
          {message.relevance_score && (
            <span className={cn(
              "px-1.5 py-0.5 rounded text-xs font-medium",
              message.relevance_score === 'High' && "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
              message.relevance_score === 'Medium' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
              message.relevance_score === 'Low' && "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            )}>
              {message.relevance_score}
            </span>
          )}
        </Button>
        
        {isSourcesExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {message.sources_used.map((source: SourceDocument) => (
              <div
                key={`${source.document_id}-${source.chunk_id}`}
                className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs"
              >
                <div className="flex-1">
                  <div className="font-medium text-foreground mb-1">
                    {source.filename}
                  </div>
                  <div className="text-muted-foreground line-clamp-2">
                    {source.content_snippet}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <span>Score: {source.relevance_score.toFixed(2)}</span>
                    <span>•</span>
                    <span>Chunk {source.chunk_id}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    // TODO: Implement source document viewing
                    console.log('View source:', source)
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    )
  }

  const renderProcessingInfo = () => {
    if (!isAssistant || !message.processing_time) return null

    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        {message.processing_time && (
          <span>{message.processing_time}</span>
        )}
        {message.tokens_used && (
          <>
            <span>•</span>
            <span>{message.tokens_used} tokens</span>
          </>
        )}
        {message.model_used && (
          <>
            <span>•</span>
            <span>{message.model_used}</span>
          </>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-3 max-w-4xl",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground"
      )}>
        {isUser ? "U" : "AI"}
      </div>

      {/* Message content */}
      <div className={cn(
        "flex-1 min-w-0",
        isUser ? "text-right" : "text-left"
      )}>
        <div className={cn(
          "inline-block max-w-full p-3 rounded-lg relative group",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-foreground"
        )}>
          {/* Message content */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {isUser ? (
              <p className="m-0 whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="markdown-content"
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  code: ({ inline, children, ...props }: any) => (
                    inline ? (
                      <code className="bg-background/20 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-background/20 p-2 rounded-md overflow-x-auto">
                        <code className="text-xs font-mono" {...props}>
                          {children}
                        </code>
                      </pre>
                    )
                  )
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Copy button */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
              isUser ? "text-primary-foreground/70 hover:text-primary-foreground" : ""
            )}
            onClick={handleCopy}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>

        {/* Sources */}
        {renderSources()}

        {/* Processing info and timestamp */}
        <div className={cn(
          "mt-1 flex items-center gap-2 text-xs text-muted-foreground",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span>{formatDate(message.created_at)}</span>
          {renderProcessingInfo()}
        </div>
      </div>
    </motion.div>
  )
}
