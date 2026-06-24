import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IntelligenceComposer from '../../../../shared/components/IntelligenceComposer/IntelligenceComposer.jsx'
import { ROUTES } from '../../../../shared/config/routes.js'
import { hasComposerContext } from '../../../intelligence/utils/snapshotComposerContext.js'
import { useIntelligenceComposerContext } from '../../../intelligence/hooks/useIntelligenceComposerContext.js'
import { usePlans } from '../../context/PlansContext.jsx'
import styles from '../../pages/Workspace/Workspace.module.css'

export default function WorkspaceIntelligenceSection({ firstName, accentStyle }) {
  const navigate = useNavigate()
  const { aiChips = [], setAiChips = () => {} } = usePlans()
  const composerContext = useIntelligenceComposerContext({ scope: 'workspace' })
  const activeConnectors = aiChips.filter((c) => c.kind === 'connector').map((c) => c.type)
  const [draft, setDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => () => {
    recognitionRef.current?.abort?.()
    recognitionRef.current = null
  }, [])

  const navigateToChat = () => {
    const text = draft.trim()
    if (!text && !hasComposerContext(aiChips)) return

    navigate(ROUTES.workspaceChat, {
      state: {
        handoffId: window.crypto?.randomUUID?.() ?? `handoff-${Date.now()}`,
        initialPrompt: text,
        submitComposer: true,
      },
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    navigateToChat()
  }

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript?.trim())
        .filter(Boolean)
        .join(' ')
      if (transcript) {
        setDraft((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript))
      }
    }
    recognition.onerror = () => {
      recognitionRef.current = null
      setIsListening(false)
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }


  return (
    <section
      className={styles.intelligenceSection}
      style={accentStyle}
      aria-label="Seção do Intelligence"
    >
      <div className={styles.intelligenceStage}>
        <p className={styles.intelligenceGreeting}>Olá, {firstName}</p>
        <h2 className={styles.intelligenceTitle}>O que vamos construir hoje?</h2>
        <IntelligenceComposer
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          motionLayoutId="ai-composer"
          submitDisabled={!draft.trim() && !hasComposerContext(aiChips)}
          isListening={isListening}
          onVoiceClick={handleVoiceInput}
          voiceAriaLabelListening="Parar gravação de áudio"
          aiChips={aiChips}
          onChipsChange={setAiChips}
          {...composerContext}
          showGitHubBar={activeConnectors.includes('github')}
          githubBarPlacement="insideForm"
          githubBarClassName={`${styles.intelligenceSuggestions} ${styles.intelligenceGitHubBar}`}
          classes={{
            form: styles.intelligencePromptCard,
            input: styles.intelligencePrompt,
            controls: styles.intelligencePromptControls,
            contextSlot: styles.intelligenceContextLeft,
            actions: styles.intelligencePromptActions,
            iconButton: styles.intelligenceIconButton,
            iconButtonActive: styles.intelligenceIconButtonActive,
            sendButton: styles.intelligenceSendButton,
          }}
        />
      </div>
    </section>
  )
}
