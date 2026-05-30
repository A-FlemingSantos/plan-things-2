import { useEffect, useRef } from 'react'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import {
  getThreadMessageDisplayText,
  isAssistantMessagePending,
} from '../../../../shared/contracts/intelligenceContracts.js'
import UserChatMessage from '../UserChatMessage/UserChatMessage.jsx'
import defaultStyles from './IntelligenceConversationThread.module.css'

function joinClasses(...parts) {
  return parts.filter(Boolean).join(' ')
}

export default function IntelligenceConversationThread({
  messages = [],
  isThinking = false,
  style,
  className,
  classes = {},
  ariaLabel = 'Conversa com o Intelligence',
  scrollIntoView = true,
  useCustomScrollbar = false,
}) {
  const {
    scroll: scrollClass,
    messages: messagesClass,
    messageUser: messageUserClass,
    messageAssistant: messageAssistantClass,
    thinking: thinkingClass,
  } = classes

  const scrollRef = useRef(null)
  const endRef = useRef(null)

  useEffect(() => {
    if (!scrollIntoView) return
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking, scrollIntoView])

  if (messages.length === 0 && !isThinking) return null
  const hasPendingAssistantMessage = messages.some(isAssistantMessagePending)
  const shouldRenderLegacyThinking = isThinking && !hasPendingAssistantMessage

  const content = (
    <div className={joinClasses(defaultStyles.messages, messagesClass)}>
      {messages.map((msg) => (
        msg.role === 'user' ? (
          <UserChatMessage
            key={msg.id}
            text={msg.text}
            contextSnapshot={msg.contextSnapshot}
            bubbleClassName={messageUserClass || defaultStyles.messageUser}
          />
        ) : (
          (() => {
            const pending = isAssistantMessagePending(msg)
            const displayText = getThreadMessageDisplayText(msg)
            if (!pending && !displayText) return null

            return (
              <div
                key={msg.id}
                className={messageAssistantClass || defaultStyles.messageAssistant}
                aria-busy={pending ? 'true' : undefined}
              >
                {pending && !displayText ? 'Pensando...' : displayText}
              </div>
            )
          })()
        )
      ))}
      {shouldRenderLegacyThinking ? (
        <div className={thinkingClass || defaultStyles.thinking}>
          Pensando...
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  )

  if (useCustomScrollbar) {
    return (
      <CustomScrollArea
        enabled
        refreshKey={`thread-${messages.length}-${isThinking ? 'thinking' : 'idle'}`}
        className={className}
        viewportClassName={scrollClass}
        viewportProps={{
          style,
          role: 'log',
          'aria-label': ariaLabel,
          'aria-live': 'polite',
        }}
      >
        {content}
      </CustomScrollArea>
    )
  }

  return (
    <div
      ref={scrollRef}
      className={joinClasses(defaultStyles.scroll, scrollClass, className)}
      style={style}
      role="log"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      {content}
    </div>
  )
}
