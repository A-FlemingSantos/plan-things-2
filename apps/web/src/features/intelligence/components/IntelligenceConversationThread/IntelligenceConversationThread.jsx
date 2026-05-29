import { useEffect, useRef } from 'react'
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

  return (
    <div
      ref={scrollRef}
      className={joinClasses(defaultStyles.scroll, scrollClass, className)}
      style={style}
      role="log"
      aria-label={ariaLabel}
      aria-live="polite"
    >
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
            <div
              key={msg.id}
              className={messageAssistantClass || defaultStyles.messageAssistant}
            >
              {msg.text}
            </div>
          )
        ))}
        {isThinking ? (
          <div className={thinkingClass || defaultStyles.thinking}>
            Pensando...
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
    </div>
  )
}
