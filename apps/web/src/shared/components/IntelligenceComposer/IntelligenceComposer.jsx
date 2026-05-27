import { motion } from 'framer-motion'
import AiComposerContextMenu from '../AiComposerContextMenu/AiComposerContextMenu.jsx'
import GitHubContextBar from '../GitHubContextBar/GitHubContextBar.jsx'

function MicIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 8.8a2.2 2.2 0 0 0 2.2-2.2V3.7a2.2 2.2 0 1 0-4.4 0v2.9A2.2 2.2 0 0 0 7 8.8z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.8 6.7a4.2 4.2 0 0 0 8.4 0M7 10.9v1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 11.5v-9M3.5 6 7 2.5 10.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function joinClasses(...parts) {
  return parts.filter(Boolean).join(' ')
}

/**
 * Shared Intelligence prompt composer (markup + behavior).
 * Visual styles come from the parent page via `classes`.
 */
export default function IntelligenceComposer({
  value,
  onChange,
  onSubmit,
  placeholder = 'Descreva seu produto, fluxo ou ideia...',
  inputAriaLabel = 'Prompt do Intelligence',
  rows = 2,
  inputRef,
  inputDisabled = false,
  submitDisabled,
  motionLayoutId,
  classes = {},
  aiChips = [],
  onChipsChange,
  showGitHubBar = false,
  githubBarClassName,
  githubBarPlacement = 'afterForm',
  isListening = false,
  onVoiceClick,
  showVoiceButton = true,
  voiceAriaLabelListening = 'Parar gravação de áudio para o Intelligence',
  voiceAriaLabelIdle = 'Gravar áudio para o Intelligence',
  submitAriaLabel = 'Enviar prompt ao Intelligence',
  afterForm = null,
}) {
  const {
    form,
    input,
    controls,
    contextSlot,
    actions,
    iconButton,
    iconButtonActive,
    sendButton,
  } = classes

  const isSubmitDisabled = submitDisabled ?? !String(value ?? '').trim()

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const githubBar = showGitHubBar ? <GitHubContextBar className={githubBarClassName} /> : null

  const formBody = (
    <>
      <textarea
        ref={inputRef}
        className={input}
        placeholder={placeholder}
        aria-label={inputAriaLabel}
        rows={rows}
        value={value}
        disabled={inputDisabled}
        onChange={(event) => onChange?.(event.target.value, event)}
        onKeyDown={handleInputKeyDown}
      />
      <div className={controls}>
        <div className={contextSlot}>
          <AiComposerContextMenu onChipsChange={onChipsChange} initialChips={aiChips} />
        </div>
        <div className={actions}>
          {showVoiceButton ? (
            <button
              type="button"
              className={joinClasses(iconButton, isListening && iconButtonActive)}
              aria-label={isListening ? voiceAriaLabelListening : voiceAriaLabelIdle}
              aria-pressed={isListening}
              onClick={onVoiceClick}
            >
              <MicIcon />
            </button>
          ) : null}
          <button
            type="submit"
            className={sendButton}
            aria-label={submitAriaLabel}
            disabled={isSubmitDisabled}
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>
      {githubBarPlacement === 'insideForm' ? githubBar : null}
    </>
  )

  if (motionLayoutId) {
    return (
      <>
        <motion.form
          className={form}
          onSubmit={onSubmit}
          layoutId={motionLayoutId}
        >
          {formBody}
        </motion.form>
        {githubBarPlacement === 'afterForm' ? githubBar : null}
        {afterForm}
      </>
    )
  }

  return (
    <>
      <form className={form} onSubmit={onSubmit}>
        {formBody}
      </form>
      {githubBarPlacement === 'afterForm' ? githubBar : null}
      {afterForm}
    </>
  )
}
