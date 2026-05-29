import { useCallback, useLayoutEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import AiComposerContextMenu from '../AiComposerContextMenu/AiComposerContextMenu.jsx'
import ComposerAttachmentStrip from '../ComposerAttachmentStrip/ComposerAttachmentStrip.jsx'
import {
  appendClipboardImagesAsAttachments,
  partitionComposerChips,
  removeAttachmentChip,
} from '../ComposerAttachmentStrip/composerAttachmentUtils.js'
import GitHubContextBar from '../GitHubContextBar/GitHubContextBar.jsx'
import styles from './IntelligenceComposer.module.css'

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

function syncTextareaHeight(textarea, minRows, maxRows) {
  if (!textarea) return

  const computedStyle = window.getComputedStyle(textarea)
  const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 18
  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0
  const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0
  const borderTopWidth = Number.parseFloat(computedStyle.borderTopWidth) || 0
  const borderBottomWidth = Number.parseFloat(computedStyle.borderBottomWidth) || 0
  const blockOffset = paddingTop + paddingBottom + borderTopWidth + borderBottomWidth
  const minimumHeight = Math.round(lineHeight * minRows + blockOffset)
  const maximumHeight = Math.round(lineHeight * maxRows + blockOffset)

  textarea.style.height = 'auto'

  const nextHeight = Math.min(textarea.scrollHeight, maximumHeight)
  textarea.style.height = `${Math.max(nextHeight, minimumHeight)}px`
  textarea.style.overflowY = textarea.scrollHeight > maximumHeight ? 'auto' : 'hidden'
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
  maxRows = 7,
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
    inputWithAttachments,
    attachmentStrip,
    controls,
    contextSlot,
    actions,
    iconButton,
    iconButtonActive,
    sendButton,
  } = classes
  const textareaRef = useRef(null)

  const { attachments } = partitionComposerChips(aiChips)
  const hasAttachments = attachments.length > 0
  const isSubmitDisabled = submitDisabled ?? !String(value ?? '').trim()
  const formClassName = joinClasses(styles.composerVars, form)

  const setTextareaRef = useCallback((node) => {
    textareaRef.current = node

    if (!inputRef) return
    if (typeof inputRef === 'function') {
      inputRef(node)
      return
    }
    inputRef.current = node
  }, [inputRef])

  useLayoutEffect(() => {
    syncTextareaHeight(textareaRef.current, rows, Math.max(rows, maxRows))
  }, [maxRows, rows, value, hasAttachments])

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const handlePaste = async (event) => {
    if (inputDisabled || !onChipsChange) return

    const { chips: nextChips, handled } = await appendClipboardImagesAsAttachments(
      aiChips,
      event.clipboardData,
    )

    if (!handled) return

    event.preventDefault()
    onChipsChange(nextChips)
  }

  const handleRemoveAttachment = (attachment) => {
    if (!onChipsChange) return
    onChipsChange(removeAttachmentChip(aiChips, attachment.type))
  }

  const githubBar = showGitHubBar ? <GitHubContextBar className={githubBarClassName} /> : null

  const formBody = (
    <>
      <ComposerAttachmentStrip
        attachments={attachments}
        onRemove={handleRemoveAttachment}
        className={attachmentStrip}
      />
      <textarea
        ref={setTextareaRef}
        className={joinClasses(input, hasAttachments && inputWithAttachments)}
        placeholder={placeholder}
        aria-label={inputAriaLabel}
        rows={rows}
        value={value}
        disabled={inputDisabled}
        data-has-attachments={hasAttachments ? 'true' : undefined}
        onChange={(event) => onChange?.(event.target.value, event)}
        onKeyDown={handleInputKeyDown}
        onPaste={handlePaste}
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
          className={formClassName}
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
      <form className={formClassName} onSubmit={onSubmit}>
        {formBody}
      </form>
      {githubBarPlacement === 'afterForm' ? githubBar : null}
      {afterForm}
    </>
  )
}
