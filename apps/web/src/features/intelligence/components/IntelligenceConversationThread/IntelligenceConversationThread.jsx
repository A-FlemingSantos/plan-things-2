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

function getDistanceFromBottom(scrollContainer) {
  if (!scrollContainer) return Number.POSITIVE_INFINITY
  return (
    scrollContainer.scrollHeight
    - scrollContainer.scrollTop
    - scrollContainer.clientHeight
  )
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
  scrollToBottomOnMount = false,
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
  const initialBottomScrollDoneRef = useRef(false)
  const autoScrollPinnedRef = useRef(true)

  useEffect(() => {
    const scrollContainer = endRef.current?.closest('[role="log"]') ?? scrollRef.current
    if (!scrollContainer) {
      return undefined
    }

    const syncPinnedState = () => {
      autoScrollPinnedRef.current = (
        getDistanceFromBottom(scrollContainer) <= STREAM_SCROLL_BOTTOM_THRESHOLD_PX
      )
    }

    syncPinnedState()
    scrollContainer.addEventListener('scroll', syncPinnedState, { passive: true })

    return () => {
      scrollContainer.removeEventListener('scroll', syncPinnedState)
    }
  }, [useCustomScrollbar, messages.length])

  useEffect(() => {
    if (!scrollIntoView) return
    const nextMessageCount = messages.length
    const previousMessageCount = previousMessageCountRef.current
    const isMessageAppended = nextMessageCount > previousMessageCount

    if (
      scrollToBottomOnMount
      && !initialBottomScrollDoneRef.current
      && nextMessageCount > 0
    ) {
      previousMessageCountRef.current = nextMessageCount
      initialBottomScrollDoneRef.current = true
      autoScrollPinnedRef.current = true
      endRef.current?.scrollIntoView({ behavior: 'auto' })
      return
    }

    previousMessageCountRef.current = nextMessageCount

    if (!isMessageAppended) {
      if (!autoScrollPinnedRef.current) {
        return
      }

      const now = Date.now()
      if (now - lastStreamScrollAtRef.current < STREAM_SCROLL_THROTTLE_MS) {
        return
      }

      lastStreamScrollAtRef.current = now
    }

    autoScrollPinnedRef.current = true
    endRef.current?.scrollIntoView({ behavior: isMessageAppended ? 'smooth' : 'auto' })
  }, [messages, isThinking, scrollIntoView, scrollToBottomOnMount])

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
