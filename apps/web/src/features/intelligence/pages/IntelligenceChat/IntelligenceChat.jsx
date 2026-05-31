import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import WorkspaceHeader from '../../../../shared/components/WorkspaceHeader/WorkspaceHeader.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { usePlans } from '../../../workspace/context/PlansContext.jsx'
import {
  resolveKanbanAccentColor,
  resolveKanbanAccentForeground,
} from '../../../workspace/data/kanbanColorPalette.js'
import IntelligenceComposer from '../../../../shared/components/IntelligenceComposer/IntelligenceComposer.jsx'
import IntelligenceConversationThread from '../../components/IntelligenceConversationThread/IntelligenceConversationThread.jsx'
import ConversationToolbar from '../../components/ConversationToolbar/ConversationToolbar.jsx'
import { listIntelligenceConversations, updateIntelligenceConversation } from '../../api/intelligenceApi.js'
import { useAiConversation } from '../../hooks/useAiConversation.js'
import styles from './IntelligenceChat.module.css'

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8.7 1.8 4.9 7.3h2.5l-.7 6.1 4-5.6H8.2l.5-6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const VOICE_INPUT_ERROR_MESSAGES = {
  'audio-capture': 'Nenhum microfone disponível foi encontrado.',
  'language-not-supported': 'Reconhecimento de voz em português não está disponível neste navegador.',
  network: 'O reconhecimento de voz do navegador está indisponível. Tente Chrome/Edge com internet ou digite o prompt.',
  'no-speech': 'Não detectei fala. Tente novamente falando mais perto do microfone.',
  'not-allowed': 'Permissão do microfone negada. Libere o acesso ao microfone no navegador.',
  'service-not-allowed': 'O navegador bloqueou o serviço de reconhecimento de voz.',
}

const MAX_VOICE_RESTART_ATTEMPTS = 3
const VOICE_RESTART_BASE_DELAY_MS = 350
const VOICE_RESTART_STEP_DELAY_MS = 250
const VOICE_RESTART_MAX_DELAY_MS = 1000
const VOICE_STOP_FINALIZE_DELAY_MS = 600

const CHAT_SUGGESTIONS = [
  { label: 'Sincronizar calendário', prompt: 'Sincronize meu calendário e sugira os próximos blocos de trabalho.' },
  { label: 'Criar pitch deck', prompt: 'Crie uma estrutura de pitch deck para apresentar esta ideia.' },
  { label: 'Inicializar UI system', prompt: 'Inicialize um UI system com componentes e tokens essenciais.' },
]

function getVoiceInputErrorMessage(error) {
  const code = error?.error || error?.name
  if (code === 'NotAllowedError' || code === 'PermissionDeniedError') return VOICE_INPUT_ERROR_MESSAGES['not-allowed']
  if (code === 'NotFoundError' || code === 'DevicesNotFoundError') return VOICE_INPUT_ERROR_MESSAGES['audio-capture']
  return VOICE_INPUT_ERROR_MESSAGES[code] || 'Não foi possível capturar o áudio agora.'
}

export default function IntelligenceChat() {
  const location = useLocation()
  const { accessToken, currentUser } = useAuth()
  const { localPreferences } = usePreferences()
  const { aiChips = [], setAiChips = () => {} } = usePlans()
  const activeConnectors = useMemo(
    () => aiChips.filter((c) => c.kind === 'connector').map((c) => c.type),
    [aiChips],
  )
  const userFirstName = currentUser?.fullName?.split(' ')[0] ?? 'Arthur'
  const chatScope = {
    planId: location.state?.planId ?? null,
    planName: location.state?.planName ?? null,
    cardId: location.state?.cardId ?? null,
    cardTitle: location.state?.cardTitle ?? null,
  }

  const [draft, setDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState('')

  const [recentConversations, setRecentConversations] = useState([])

  const {
    conversationId,
    messages,
    isThinking,
    hasConversation,
    submitMessage,
    canSubmitWith,
  } = useAiConversation({
    accessToken,
    enabled: true,
    scope: chatScope,
    aiChips,
    setAiChips,
    initialPrompt: location.state?.initialPrompt,
    initialSubmitComposer: location.state?.submitComposer,
  })

  const recognitionRef = useRef(null)
  const voiceEndingRecognitionRef = useRef(null)
  const recognitionRestartTimerRef = useRef(null)
  const voiceStopFinalizeTimerRef = useRef(null)
  const voiceListeningRequestedRef = useRef(false)
  const voiceRestartAttemptsRef = useRef(0)
  const stopRequestedRef = useRef(false)
  const voiceCaptureFinalizedRef = useRef(false)
  const lastVoiceRecognitionErrorRef = useRef('')
  const voiceTranscriptEntriesRef = useRef(new Map())
  const voiceRecognitionSequenceRef = useRef(0)

  useEffect(() => {
    if (!accessToken) return undefined

    let cancelled = false

    void listIntelligenceConversations({
      token: accessToken,
      planId: chatScope.planId,
      cardId: chatScope.cardId,
    })
      .then((items) => {
        if (cancelled) return
        setRecentConversations(
          (Array.isArray(items) ? items : []).map((conversation) => ({
            id: String(conversation.id),
            title: conversation.title || 'Conversa sem título',
          })),
        )
      })
      .catch(() => {
        if (!cancelled) setRecentConversations([])
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, chatScope.cardId, chatScope.planId, conversationId])

  const activeConversationTitle = useMemo(() => {
    const match = recentConversations.find((item) => item.id === conversationId)
    return match?.title ?? 'Nova conversa'
  }, [conversationId, recentConversations])

  const handleArchiveConversation = async (targetConversationId) => {
    if (!accessToken || !targetConversationId) return

    await updateIntelligenceConversation(targetConversationId, { status: 'ARCHIVED' }, { token: accessToken })
    setRecentConversations((current) => current.filter((item) => item.id !== targetConversationId))
  }

  const accentStyle = {
    '--intelligence-theme-accent': resolveKanbanAccentColor(localPreferences?.kanbanAccentColor),
    '--intelligence-theme-accent-foreground': resolveKanbanAccentForeground(localPreferences?.kanbanAccentColor),
    '--intelligence-accent': resolveKanbanAccentColor(localPreferences?.kanbanAccentColor),
    '--intelligence-accent-foreground': resolveKanbanAccentForeground(localPreferences?.kanbanAccentColor),
  }

  useEffect(() => () => {
    if (recognitionRestartTimerRef.current) clearTimeout(recognitionRestartTimerRef.current)
    if (voiceStopFinalizeTimerRef.current) clearTimeout(voiceStopFinalizeTimerRef.current)
    voiceListeningRequestedRef.current = false
    stopRequestedRef.current = true
    voiceCaptureFinalizedRef.current = true
    recognitionRef.current?.abort?.()
    recognitionRef.current = null
    voiceEndingRecognitionRef.current = null
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (await submitMessage(draft)) {
      setDraft('')
      setVoiceFeedback('')
    }
  }

  const clearRecognitionRestartTimer = () => {
    if (!recognitionRestartTimerRef.current) return
    clearTimeout(recognitionRestartTimerRef.current)
    recognitionRestartTimerRef.current = null
  }

  const clearVoiceStopFinalizeTimer = () => {
    if (!voiceStopFinalizeTimerRef.current) return
    clearTimeout(voiceStopFinalizeTimerRef.current)
    voiceStopFinalizeTimerRef.current = null
  }

  const appendVoiceTranscriptToPrompt = () => {
    const transcript = [...voiceTranscriptEntriesRef.current.values()]
      .sort((a, b) => a.recognitionSequence - b.recognitionSequence || a.resultIndex - b.resultIndex)
      .map(({ transcript: t }) => t)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    voiceTranscriptEntriesRef.current.clear()
    voiceRecognitionSequenceRef.current = 0
    if (!transcript) return false
    setDraft((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript))
    return true
  }

  const finishVoiceCapture = (emptyFeedback = 'Captura de voz interrompida.') => {
    if (voiceCaptureFinalizedRef.current) return false
    voiceCaptureFinalizedRef.current = true
    clearRecognitionRestartTimer()
    clearVoiceStopFinalizeTimer()
    voiceListeningRequestedRef.current = false
    stopRequestedRef.current = false
    lastVoiceRecognitionErrorRef.current = ''
    recognitionRef.current = null
    voiceEndingRecognitionRef.current = null
    voiceRestartAttemptsRef.current = 0
    setIsListening(false)
    const didCommit = appendVoiceTranscriptToPrompt()
    setVoiceFeedback(didCommit ? 'Texto de voz adicionado ao prompt.' : emptyFeedback)
    return didCommit
  }

  const failVoiceCapture = (feedback) => {
    if (voiceCaptureFinalizedRef.current) return
    voiceCaptureFinalizedRef.current = true
    clearRecognitionRestartTimer()
    clearVoiceStopFinalizeTimer()
    voiceListeningRequestedRef.current = false
    stopRequestedRef.current = false
    lastVoiceRecognitionErrorRef.current = ''
    recognitionRef.current = null
    voiceEndingRecognitionRef.current = null
    voiceRestartAttemptsRef.current = 0
    voiceTranscriptEntriesRef.current.clear()
    voiceRecognitionSequenceRef.current = 0
    setIsListening(false)
    setVoiceFeedback(feedback)
  }

  const scheduleVoiceStopFinalization = (emptyFeedback = 'Captura de voz interrompida.') => {
    if (voiceStopFinalizeTimerRef.current || voiceCaptureFinalizedRef.current) return
    voiceStopFinalizeTimerRef.current = setTimeout(() => {
      voiceStopFinalizeTimerRef.current = null
      if (!stopRequestedRef.current && !voiceEndingRecognitionRef.current) return
      finishVoiceCapture(emptyFeedback)
    }, VOICE_STOP_FINALIZE_DELAY_MS)
  }

  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return

    if (voiceListeningRequestedRef.current || recognitionRef.current || recognitionRestartTimerRef.current) {
      const activeRecognition = recognitionRef.current
      voiceListeningRequestedRef.current = false
      stopRequestedRef.current = true
      voiceRestartAttemptsRef.current = 0
      lastVoiceRecognitionErrorRef.current = ''
      clearRecognitionRestartTimer()
      setIsListening(false)
      setVoiceFeedback('Finalizando captura de voz...')
      if (!activeRecognition) { finishVoiceCapture(); return }
      try {
        activeRecognition.stop?.()
        scheduleVoiceStopFinalization()
      } catch {
        try { activeRecognition.abort?.() } catch { /* noop */ }
        finishVoiceCapture()
      }
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setVoiceFeedback('Ditado por voz não está disponível neste navegador.'); return }
    if (window.isSecureContext === false) { setVoiceFeedback('O microfone só pode ser usado em HTTPS ou localhost.'); return }

    const scheduleRecognitionRestart = (reason = '') => {
      if (!voiceListeningRequestedRef.current || stopRequestedRef.current) return
      if (recognitionRestartTimerRef.current) return
      const isErrorRestart = reason === 'network' || reason === 'invalid-state'
      if (isErrorRestart && voiceRestartAttemptsRef.current >= MAX_VOICE_RESTART_ATTEMPTS) {
        finishVoiceCapture(getVoiceInputErrorMessage(reason === 'network' ? { error: 'network' } : { name: 'InvalidStateError' }))
        return
      }
      const delay = Math.min(VOICE_RESTART_BASE_DELAY_MS + voiceRestartAttemptsRef.current * VOICE_RESTART_STEP_DELAY_MS, VOICE_RESTART_MAX_DELAY_MS)
      voiceRestartAttemptsRef.current = isErrorRestart ? voiceRestartAttemptsRef.current + 1 : 0
      setIsListening(true)
      setVoiceFeedback(isErrorRestart && voiceRestartAttemptsRef.current > 1 ? 'Reconectando captura de voz...' : 'Ouvindo... clique no microfone para parar.')
      recognitionRestartTimerRef.current = setTimeout(() => { recognitionRestartTimerRef.current = null; startRecognition() }, delay)
    }

    const startRecognition = () => {
      if (!voiceListeningRequestedRef.current || stopRequestedRef.current) return
      const recognition = new SpeechRecognition()
      const seq = voiceRecognitionSequenceRef.current
      voiceRecognitionSequenceRef.current += 1
      recognition.lang = 'pt-BR'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognition.onstart = () => {
        if (recognitionRef.current !== recognition) return
        lastVoiceRecognitionErrorRef.current = ''
        setIsListening(true)
        setVoiceFeedback('Ouvindo... clique no microfone para parar.')
      }
      recognition.onerror = (event) => {
        if (recognitionRef.current !== recognition && !stopRequestedRef.current) return
        if (event?.error === 'aborted' || stopRequestedRef.current) return
        if (event?.error === 'network') { lastVoiceRecognitionErrorRef.current = 'network'; setIsListening(true); setVoiceFeedback('Ouvindo... clique no microfone para parar.'); return }
        if (event?.error === 'no-speech') { finishVoiceCapture(getVoiceInputErrorMessage(event)); return }
        failVoiceCapture(getVoiceInputErrorMessage(event))
      }
      recognition.onend = () => {
        if (voiceCaptureFinalizedRef.current) return
        const wasCurrent = recognitionRef.current === recognition
        if (recognitionRef.current === recognition) { recognitionRef.current = null; voiceEndingRecognitionRef.current = recognition }
        if (!wasCurrent && voiceEndingRecognitionRef.current !== recognition) return
        if (stopRequestedRef.current || !voiceListeningRequestedRef.current) { voiceEndingRecognitionRef.current = recognition; scheduleVoiceStopFinalization(); return }
        voiceEndingRecognitionRef.current = recognition
        const restartReason = lastVoiceRecognitionErrorRef.current
        lastVoiceRecognitionErrorRef.current = ''
        scheduleRecognitionRestart(restartReason)
      }
      recognition.onresult = (event) => {
        const isActive = recognitionRef.current === recognition
        const isEnding = voiceEndingRecognitionRef.current === recognition
        if (voiceCaptureFinalizedRef.current || (!isActive && !isEnding)) return
        const results = event.results || []
        const startIdx = Number.isInteger(event.resultIndex) ? event.resultIndex : 0
        for (let i = startIdx; i < results.length; i += 1) {
          const result = results[i]
          const transcript = result?.[0]?.transcript?.trim()
          if (!transcript) continue
          const key = `${seq}:${i}`
          const existing = voiceTranscriptEntriesRef.current.get(key)
          const isFinal = result.isFinal !== false
          if (existing?.transcript === transcript && existing?.isFinal === isFinal) continue
          voiceTranscriptEntriesRef.current.set(key, { recognitionSequence: seq, resultIndex: i, transcript, isFinal })
          voiceRestartAttemptsRef.current = 0
        }
      }
      recognitionRef.current = recognition
      try { recognition.start() } catch (error) {
        recognitionRef.current = null
        if (voiceListeningRequestedRef.current && (error?.name === 'InvalidStateError' || error?.error === 'network')) { scheduleRecognitionRestart(error?.error === 'network' ? 'network' : 'invalid-state'); return }
        failVoiceCapture(getVoiceInputErrorMessage(error))
      }
    }

    voiceListeningRequestedRef.current = true
    stopRequestedRef.current = false
    voiceCaptureFinalizedRef.current = false
    lastVoiceRecognitionErrorRef.current = ''
    voiceRestartAttemptsRef.current = 0
    voiceEndingRecognitionRef.current = null
    voiceTranscriptEntriesRef.current.clear()
    voiceRecognitionSequenceRef.current = 0
    clearRecognitionRestartTimer()
    clearVoiceStopFinalizeTimer()
    setIsListening(true)
    setVoiceFeedback('Ouvindo... clique no microfone para parar.')
    startRecognition()
  }

  return (
    <AppThemeScope>
      <ProductAppShell styles={styles} contentClassName={styles.main} contentTag="main">
        <WorkspaceHeader
          title="Intelligence"
          icon={<SparkleIcon />}
          compact
          sticky
          centerContent={(
            <ConversationToolbar
              conversationTitle={activeConversationTitle}
              recentConversations={recentConversations}
              onArchiveConversation={handleArchiveConversation}
              planId={chatScope.planId}
              planName={chatScope.planName}
              cardId={chatScope.cardId}
              cardTitle={chatScope.cardTitle}
              activeConnectors={activeConnectors}
            />
          )}
        />

        <div className={styles.chatArea}>
          {hasConversation ? (
            <IntelligenceConversationThread
              messages={messages}
              isThinking={isThinking}
              className={styles.chatThreadScroll}
              classes={{
                messages: styles.messages,
                messageUser: styles.messageUser,
                messageAssistant: styles.messageAssistant,
                thinking: styles.thinking,
              }}
              style={accentStyle}
            />
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyGreeting}>Olá, {userFirstName}</p>
              <h2 className={styles.emptyTitle}>O que vamos construir hoje?</h2>
              <div className={styles.emptySuggestions}>
                {CHAT_SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className={styles.emptySuggestionButton}
                    onClick={async () => {
                      if (await submitMessage(s.prompt)) {
                        setDraft('')
                        setVoiceFeedback('')
                      }
                    }}
                    disabled={isThinking}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.composerArea} style={accentStyle}>
          <IntelligenceComposer
            value={draft}
            onChange={setDraft}
            onSubmit={handleSubmit}
            motionLayoutId="ai-composer"
            submitDisabled={!canSubmitWith(draft, aiChips)}
            isListening={isListening}
            onVoiceClick={handleVoiceInput}
            aiChips={aiChips}
            onChipsChange={setAiChips}
            showGitHubBar={activeConnectors.includes('github')}
            githubBarClassName={styles.githubContextBar}
            classes={{
              form: styles.composerCard,
              input: styles.composerInput,
              controls: styles.composerControls,
              contextSlot: styles.composerLeft,
              actions: styles.actions,
              iconButton: styles.iconButton,
              iconButtonActive: styles.iconButtonActive,
              sendButton: styles.sendButton,
            }}
            afterForm={voiceFeedback ? (
              <p className={styles.voiceFeedback} role="status">{voiceFeedback}</p>
            ) : null}
          />
        </div>
      </ProductAppShell>
    </AppThemeScope>
  )
}
