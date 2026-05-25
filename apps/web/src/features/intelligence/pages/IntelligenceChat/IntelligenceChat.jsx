import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import WorkspaceHeader from '../../../../shared/components/WorkspaceHeader/WorkspaceHeader.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import {
  resolveKanbanAccentColor,
  resolveKanbanAccentForeground,
} from '../../../workspace/data/kanbanColorPalette.js'
import styles from './IntelligenceChat.module.css'

function PlusIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function MicIcon()     { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 8.8a2.2 2.2 0 0 0 2.2-2.2V3.7a2.2 2.2 0 1 0-4.4 0v2.9A2.2 2.2 0 0 0 7 8.8z" stroke="currentColor" strokeWidth="1.2"/><path d="M2.8 6.7a4.2 4.2 0 0 0 8.4 0M7 10.9v1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function ArrowUpIcon() { return <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 11.5v-9M3.5 6 7 2.5 10.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8.7 1.8 4.9 7.3h2.5l-.7 6.1 4-5.6H8.2l.5-6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function PlansIcon()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="3.2" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="6.6" width="12" height="3.2" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="11" width="7.5" height="3" rx="1.2" stroke="currentColor" strokeWidth="1.3"/></svg> }
function FilesIcon()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V6L9 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V6H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> }
function InboxIcon()   { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3h10v10H3V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M3 9h3l1.2 2h1.6L10 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function PlugIcon()    { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 2.5v3M10 2.5v3M5.2 5.5h5.6v1.8a2.8 2.8 0 0 1-2.8 2.8h-.2a2.8 2.8 0 0 1-2.8-2.8V5.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10.1v3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> }
function ChevronIcon() { return <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CheckIcon()   { return <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XSmallIcon()  { return <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> }

const GitHubLogo = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 1.4a6.6 6.6 0 0 0-2.1 12.85c.33.06.45-.14.45-.32v-1.2c-1.82.4-2.2-.77-2.2-.77-.3-.74-.73-.94-.73-.94-.6-.41.05-.4.05-.4.66.05 1 .67 1 .67.6 1 .15.52 1.5.4.05-.43.23-.73.42-.89-1.45-.16-2.98-.72-2.98-3.22 0-.71.25-1.3.67-1.75-.07-.16-.29-.82.06-1.7 0 0 .55-.18 1.8.67a6.26 6.26 0 0 1 3.28 0c1.24-.85 1.79-.67 1.79-.67.35.88.13 1.54.06 1.7.42.45.67 1.04.67 1.75 0 2.5-1.53 3.06-2.99 3.22.24.2.45.61.45 1.24v1.84c0 .18.12.38.46.31A6.6 6.6 0 0 0 8 1.4Z" fill="currentColor" />
  </svg>
)
const TeamsLogo = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1.5" y="4" width="6.5" height="8" rx="1.6" fill="#4F52D9" />
    <rect x="8.3" y="5.1" width="5.7" height="7.4" rx="1.8" fill="#7B83EB" />
    <circle cx="11.15" cy="3.95" r="1.95" fill="#6264F5" />
    <circle cx="13.1" cy="6" r="1.4" fill="#8B8CC7" />
    <path d="M3.25 6.1h3.2v1.1H5.45v4.1h-1.2V7.2H3.25V6.1Z" fill="white" />
  </svg>
)
const SlackLogo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
  </svg>
)

const CONTEXT_MENU_ITEMS = [
  { id: 'plan',  label: 'Plano',   Icon: PlansIcon },
  { id: 'file',  label: 'Arquivo', Icon: FilesIcon },
  { id: 'inbox', label: 'Inbox',   Icon: InboxIcon },
]

const CONTEXT_PLUGIN_OPTIONS = [
  { id: 'github', label: 'GitHub', Logo: GitHubLogo },
  { id: 'teams',  label: 'Teams',  Logo: TeamsLogo  },
  { id: 'slack',  label: 'Slack',  Logo: SlackLogo  },
]

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

function buildMockReply(prompt) {
  const normalized = prompt.toLowerCase()
  if (normalized.includes('calend')) return 'Posso organizar isso em blocos de foco. Comece mapeando reuniões fixas, separe 2 janelas para execução profunda e reserve um checkpoint curto no fim do dia.'
  if (normalized.includes('pitch')) return 'Uma boa base: problema, público, insight, solução, diferenciais, plano de execução e próximos passos. Se quiser, posso transformar isso em um roteiro slide a slide.'
  if (normalized.includes('ui')) return 'Vamos começar pelo essencial: tokens de cor e espaçamento, tipografia, botões, inputs, cards de conteúdo e estados de feedback. Depois conectamos isso aos fluxos principais.'
  return 'Entendi. Eu começaria separando a ideia em objetivo, usuários, fluxo principal, riscos e primeiro entregável. Me diga qual parte você quer aprofundar e eu continuo a partir dela.'
}

export default function IntelligenceChat() {
  const location = useLocation()
  const { currentUser } = useAuth()
  const { localPreferences } = usePreferences()
  const userFirstName = currentUser?.fullName?.split(' ')[0] ?? 'Arthur'

  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceFeedback, setVoiceFeedback] = useState('')
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const [isPluginsMenuOpen, setIsPluginsMenuOpen] = useState(false)
  const [contextChips, setContextChips] = useState([])

  const chatEndRef = useRef(null)
  const responseTimerRef = useRef(null)
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
  const initialMessageProcessedRef = useRef(false)
  const contextMenuRef = useRef(null)
  const contextMenuButtonRef = useRef(null)

  const accentStyle = {
    '--intelligence-theme-accent': resolveKanbanAccentColor(localPreferences?.kanbanAccentColor),
    '--intelligence-theme-accent-foreground': resolveKanbanAccentForeground(localPreferences?.kanbanAccentColor),
  }

  const submitPrompt = (value = draft) => {
    const text = value.trim()
    if (!text || isThinking) return

    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', text }])
    setDraft('')
    setVoiceFeedback('')
    setIsThinking(true)

    if (responseTimerRef.current) clearTimeout(responseTimerRef.current)

    responseTimerRef.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: `assistant-${Date.now()}`, role: 'assistant', text: buildMockReply(text) },
      ])
      setIsThinking(false)
      responseTimerRef.current = null
    }, 550)
  }

  useEffect(() => {
    if (initialMessageProcessedRef.current) return
    const initialPrompt = location.state?.initialPrompt
    if (initialPrompt?.trim()) {
      initialMessageProcessedRef.current = true
      submitPrompt(initialPrompt.trim())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => {
    if (responseTimerRef.current) clearTimeout(responseTimerRef.current)
    if (recognitionRestartTimerRef.current) clearTimeout(recognitionRestartTimerRef.current)
    if (voiceStopFinalizeTimerRef.current) clearTimeout(voiceStopFinalizeTimerRef.current)
    voiceListeningRequestedRef.current = false
    stopRequestedRef.current = true
    voiceCaptureFinalizedRef.current = true
    recognitionRef.current?.abort?.()
    recognitionRef.current = null
    voiceEndingRecognitionRef.current = null
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const handleSubmit = (event) => {
    event.preventDefault()
    submitPrompt()
  }

  const toggleContextChip = (type, label, ChipIcon, kind) => {
    setContextChips((prev) => {
      if (prev.some((c) => c.type === type)) return prev.filter((c) => c.type !== type)
      return [...prev, { id: `ctx-${type}`, type, label, ChipIcon, kind }]
    })
  }

  useEffect(() => {
    if (!isContextMenuOpen) return undefined
    const handleMouseDown = (e) => {
      if (contextMenuButtonRef.current?.contains(e.target)) return
      if (contextMenuRef.current?.contains(e.target)) return
      setIsContextMenuOpen(false)
      setIsPluginsMenuOpen(false)
    }
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return
      setIsContextMenuOpen(false)
      setIsPluginsMenuOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isContextMenuOpen])

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

  const hasMessages = messages.length > 0 || isThinking

  return (
    <AppThemeScope>
      <ProductAppShell styles={styles} contentClassName={styles.main} contentTag="main">
        <WorkspaceHeader title="Intelligence" icon={<SparkleIcon />} compact sticky />

        <div className={styles.chatArea}>
          {hasMessages ? (
            <div className={styles.messages} style={accentStyle} role="log" aria-label="Conversa com o Intelligence" aria-live="polite">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
                >
                  {msg.text}
                </div>
              ))}
              {isThinking ? <div className={styles.thinking}>Pensando...</div> : null}
              <div ref={chatEndRef} />
            </div>
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
                    onClick={() => submitPrompt(s.prompt)}
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
          <motion.form className={styles.composerCard} onSubmit={handleSubmit} layoutId="ai-composer" layout>
            <textarea
              className={styles.composerInput}
              placeholder="Descreva seu produto, fluxo ou ideia..."
              aria-label="Prompt do Intelligence"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
            />
            <div className={styles.composerControls}>
              <div className={styles.composerLeft}>
                <div className={styles.contextMenuWrap}>
                  <button
                    ref={contextMenuButtonRef}
                    type="button"
                    className={`${styles.ghostAction} ${isContextMenuOpen ? styles.ghostActionActive : ''}`}
                    aria-label="Adicionar contexto ao Intelligence"
                    aria-haspopup="menu"
                    aria-expanded={isContextMenuOpen}
                    onClick={() => {
                      setIsContextMenuOpen((v) => !v)
                      setIsPluginsMenuOpen(false)
                    }}
                  >
                    <PlusIcon />
                  </button>

                  {isContextMenuOpen ? (
                    <div
                      ref={contextMenuRef}
                      className={styles.contextMenu}
                      role="menu"
                      aria-label="Adicionar contexto ao chat"
                    >
                      {CONTEXT_MENU_ITEMS.map(({ id, label, Icon }) => {
                        const active = contextChips.some((c) => c.type === id)
                        return (
                          <button
                            key={id}
                            type="button"
                            className={`${styles.contextMenuItem} ${active ? styles.contextMenuItemActive : ''}`}
                            role="menuitem"
                            onClick={() => {
                              toggleContextChip(id, label, Icon, 'context')
                              setIsContextMenuOpen(false)
                              setIsPluginsMenuOpen(false)
                            }}
                          >
                            <span className={styles.contextMenuItemIcon} aria-hidden="true"><Icon /></span>
                            <span className={styles.contextMenuItemLabel}>{label}</span>
                            {active ? <span className={styles.contextMenuItemCheck} aria-hidden="true"><CheckIcon /></span> : null}
                          </button>
                        )
                      })}

                      <div className={styles.contextMenuDivider} role="separator" />

                      <div className={styles.contextSubmenuWrap}>
                        <button
                          type="button"
                          className={styles.contextMenuItem}
                          role="menuitem"
                          aria-haspopup="menu"
                          aria-expanded={isPluginsMenuOpen}
                          onClick={() => setIsPluginsMenuOpen((v) => !v)}
                        >
                          <span className={styles.contextMenuItemIcon} aria-hidden="true"><PlugIcon /></span>
                          <span className={styles.contextMenuItemLabel}>Integrações</span>
                          <span className={`${styles.contextMenuItemChevron} ${isPluginsMenuOpen ? styles.contextMenuItemChevronOpen : ''}`} aria-hidden="true">
                            <ChevronIcon />
                          </span>
                        </button>

                        {isPluginsMenuOpen ? (
                          <div
                            className={styles.contextSubmenu}
                            role="menu"
                            aria-label="Integrações disponíveis"
                          >
                            {CONTEXT_PLUGIN_OPTIONS.map(({ id, label, Logo }) => {
                              const active = contextChips.some((c) => c.type === id)
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  className={`${styles.contextSubmenuItem} ${active ? styles.contextMenuItemActive : ''}`}
                                  role="menuitem"
                                  onClick={() => {
                                    toggleContextChip(id, label, Logo, 'plugin')
                                    setIsContextMenuOpen(false)
                                    setIsPluginsMenuOpen(false)
                                  }}
                                >
                                  <span className={styles.contextPluginLogo} aria-hidden="true"><Logo /></span>
                                  <span>{label}</span>
                                  {active ? <span className={styles.contextMenuItemCheck} aria-hidden="true"><CheckIcon /></span> : null}
                                </button>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                {contextChips.length > 0 ? (
                  <div className={styles.contextChips} role="group" aria-label="Contexto adicionado">
                    {contextChips.map((chip) => (
                      <div key={chip.id} className={styles.contextChip} data-kind={chip.kind}>
                        <span className={styles.contextChipIcon} aria-hidden="true"><chip.ChipIcon /></span>
                        <span className={styles.contextChipLabel}>{chip.label}</span>
                        <button
                          type="button"
                          className={styles.contextChipRemove}
                          aria-label={`Remover ${chip.label} do contexto`}
                          onClick={() => setContextChips((prev) => prev.filter((c) => c.type !== chip.type))}
                        >
                          <XSmallIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.iconButton} ${isListening ? styles.iconButtonActive : ''}`}
                  aria-label={isListening ? 'Parar gravação de áudio para o Intelligence' : 'Gravar áudio para o Intelligence'}
                  aria-pressed={isListening}
                  onClick={handleVoiceInput}
                >
                  <MicIcon />
                </button>
                <button type="submit" className={styles.sendButton} aria-label="Enviar prompt ao Intelligence" disabled={!draft.trim() || isThinking}>
                  <ArrowUpIcon />
                </button>
              </div>
            </div>
          </motion.form>
          {voiceFeedback ? <p className={styles.voiceFeedback} role="status">{voiceFeedback}</p> : null}
        </div>
      </ProductAppShell>
    </AppThemeScope>
  )
}
