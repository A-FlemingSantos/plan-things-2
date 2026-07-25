import { useEffect, useMemo, useRef, useState } from 'react'
import { useIntelligenceComposerContext } from '../../../../intelligence/hooks/useIntelligenceComposerContext.js'
import { useAiConversation } from '../../../../intelligence/hooks/useAiConversation.js'

export function useKanbanBoardIntelligence({
  accessToken,
  activePlan,
  columns,
  isIntelligenceOpen,
  isIntelligencePanelMounted,
  boardAccentColor,
  boardAccentForeground,
  closeIntelligence,
}) {
  const [intelligenceDraft, setIntelligenceDraft] = useState('')
  const [kanbanAiChips, setKanbanAiChips] = useState([])
  const intelligenceActiveConnectors = kanbanAiChips.filter((c) => c.kind === 'connector').map((c) => c.type)
  const intelligencePanelRef = useRef(null)
  const intelligenceComposerInputRef = useRef(null)

  const {
    messages: intelligenceMessages,
    isThinking: isIntelligenceThinking,
    hasConversation: hasIntelligenceConversation,
    submitMessage: submitIntelligenceMessage,
    canSubmitWith: canSubmitIntelligenceMessage,
  } = useAiConversation({
    accessToken,
    enabled: isIntelligenceOpen || isIntelligencePanelMounted,
    scope: {
      planId: activePlan?.id ?? null,
      planName: activePlan?.name ?? null,
    },
    aiChips: kanbanAiChips,
    setAiChips: setKanbanAiChips,
  })

  const composerContext = useIntelligenceComposerContext({
    scope: 'board',
    boardColumns: columns,
  })

  useEffect(() => {
    if (!isIntelligencePanelMounted) return undefined

    const handleMouseDown = (event) => {
      const panel = intelligencePanelRef.current
      if (panel?.contains(event.target)) {
        return
      }
      closeIntelligence()
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      closeIntelligence()
    }

    document.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeIntelligence, isIntelligencePanelMounted])

  const intelligenceThemeStyle = useMemo(() => ({
    '--intelligence-accent': boardAccentColor,
    '--intelligence-accent-foreground': boardAccentForeground,
    '--intelligence-user-bg': boardAccentColor,
  }), [boardAccentColor, boardAccentForeground])

  const intelligencePanelStyle = useMemo(() => ({
    ...intelligenceThemeStyle,
  }), [intelligenceThemeStyle])

  return {
    intelligenceDraft,
    setIntelligenceDraft,
    kanbanAiChips,
    setKanbanAiChips,
    intelligenceActiveConnectors,
    intelligenceMessages,
    isIntelligenceThinking,
    hasIntelligenceConversation,
    submitIntelligenceMessage,
    canSubmitIntelligenceMessage,
    composerContext,
    intelligencePanelRef,
    intelligenceComposerInputRef,
    intelligencePanelStyle,
  }
}
