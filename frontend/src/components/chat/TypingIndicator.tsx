/**
 * Typing indicator component for showing when AI is responding
 */
import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3 max-w-4xl mr-auto", className)}
    >
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
        AI
      </div>

      {/* Typing animation */}
      <div className="flex-1">
        <div className="inline-block bg-muted text-foreground p-3 rounded-lg">
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <motion.div
                className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0
                }}
              />
              <motion.div
                className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.2
                }}
              />
              <motion.div
                className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.4
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
