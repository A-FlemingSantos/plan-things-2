import { useEffect, useRef } from 'react'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import {
  assistantMessageHasRenderableContent,
  getThreadMessageDisplayText,
  isAssistantMessagePending,
} from '../../../../shared/contracts/intelligenceContracts.js'
import AiBlockRenderer from '../AiBlockRenderer/AiBlockRenderer.jsx'
import InlineArtifactsList from '../InlineArtifactsList/InlineArtifactsList.jsx'
import UserChatMessage from '../UserChatMessage/UserChatMessage.jsx'
import defaultStyles from './IntelligenceConversationThread.module.css'

const STREAM_SCROLL_THROTTLE_MS = 90
const STREAM_SCROLL_BOTTOM_THRESHOLD_PX = 120

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
  } = classes

  const scrollRef = useRef(null)
  const endRef = useRef(null)
  const previousMessageCountRef = useRef(messages.length)
  const lastStreamScrollAtRef = useRef(0)

  useEffect(() => {
    if (!scrollIntoView) return
    const nextMessageCount = messages.length
    const previousMessageCount = previousMessageCountRef.current
    const isMessageAppended = nextMessageCount > previousMessageCount

    previousMessageCountRef.current = nextMessageCount

    if (!isMessageAppended) {
      const now = Date.now()
      if (now - lastStreamScrollAtRef.current < STREAM_SCROLL_THROTTLE_MS) {
        return
      }

      const scrollContainer = endRef.current?.closest('[role="log"]')
      if (scrollContainer) {
        const distanceFromBottom = (
          scrollContainer.scrollHeight
          - scrollContainer.scrollTop
          - scrollContainer.clientHeight
        )
        if (distanceFromBottom > STREAM_SCROLL_BOTTOM_THRESHOLD_PX) {
          return
        }
      }

      lastStreamScrollAtRef.current = now
    }

    endRef.current?.scrollIntoView({ behavior: isMessageAppended ? 'smooth' : 'auto' })
  }, [messages, isThinking, scrollIntoView])

  if (messages.length === 0) return null

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
            if (!assistantMessageHasRenderableContent(msg)) return null

            const pending = isAssistantMessagePending(msg)
            const displayText = getThreadMessageDisplayText(msg)
            const messageBlocks = Array.isArray(msg.blocks) ? msg.blocks : []
            const markdownBlocks = messageBlocks.filter((block) => block.type === 'MARKDOWN')
            const primaryBlocks = messageBlocks.filter((block) => block.type !== 'MARKDOWN')
            const inlineArtifacts = Array.isArray(msg.inlineArtifacts) ? msg.inlineArtifacts : []
            const hasStructuredContent = (
              markdownBlocks.length > 0
              || primaryBlocks.length > 0
              || inlineArtifacts.length > 0
            )
            const fallbackMarkdownBlocks = markdownBlocks.length === 0 && displayText
              ? [{
                id: `${msg.id}-stream-markdown`,
                type: 'MARKDOWN',
                position: -1,
                payload: { markdown: displayText },
              }]
              : []
            const markdownBlocksToRender = markdownBlocks.length > 0
              ? markdownBlocks
              : fallbackMarkdownBlocks
            if (pending && !hasStructuredContent && !displayText) {
              return null
            }

            return (
              <div
                key={msg.id}
                className={messageAssistantClass || defaultStyles.messageAssistant}
                aria-busy={pending ? 'true' : undefined}
              >
                <>
                  {markdownBlocksToRender.length > 0
                    ? <AiBlockRenderer blocks={markdownBlocksToRender} isStreaming={pending} />
                    : null}
                  {inlineArtifacts.length > 0 ? <InlineArtifactsList items={inlineArtifacts} /> : null}
                  {primaryBlocks.length > 0 ? <AiBlockRenderer blocks={primaryBlocks} /> : null}
                </>
              </div>
            )
          })()
        )
      ))}
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
