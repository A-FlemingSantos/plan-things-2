import { useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'

const ICON_SIZE = 13
const ICON_STROKE = 1.75

export default function AddCardComposer({
  addingCard,
  setAddingCard,
  newCardText,
  setNewCardText,
  onSubmit,
  onDismiss,
  onCollapseEnd,
  errorMessage,
  isSubmitting,
  styles,
}) {
  const inputRef = useRef(null)
  const shellRef = useRef(null)

  useEffect(() => {
    if (addingCard) {
      inputRef.current?.focus({ preventScroll: true })
    }
  }, [addingCard])

  useEffect(() => {
    if (!addingCard || isSubmitting) return undefined

    const handlePointerDown = (event) => {
      if (!shellRef.current?.contains(event.target)) {
        onDismiss()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [addingCard, isSubmitting, onDismiss])

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onSubmit()
      return
    }

    if (event.key === 'Escape') {
      onDismiss()
    }
  }

  const handleExpandTransitionEnd = (event) => {
    if (event.target !== event.currentTarget) return
    if (event.propertyName !== 'grid-template-rows') return
    if (addingCard || isSubmitting) return
    onCollapseEnd?.()
  }

  return (
    <div className={styles.addCardWrap}>
      <div
        ref={shellRef}
        className={`${styles.addCardShell} ${addingCard ? styles.addCardShellOpen : ''}`}
      >
        <button
          type="button"
          className={styles.addCardTrigger}
          onClick={() => setAddingCard(true)}
          disabled={isSubmitting}
          tabIndex={addingCard ? -1 : 0}
          aria-hidden={addingCard}
        >
          <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
          Adicionar cartão
        </button>

        <div className={styles.addCardExpand} aria-hidden={!addingCard} onTransitionEnd={handleExpandTransitionEnd}>
          <div className={styles.addCardExpandInner}>
            <div className={styles.addCardForm}>
              <div className={styles.addCardFormBody}>
                <input
                  ref={inputRef}
                  className={styles.addCardInput}
                  placeholder="Título do cartão"
                  value={newCardText}
                  onChange={(event) => setNewCardText(event.target.value)}
                  aria-label="Título do cartão"
                  autoComplete="off"
                  tabIndex={addingCard ? 0 : -1}
                  onKeyDown={handleInputKeyDown}
                />

                {errorMessage ? <p className={styles.addCardError}>{errorMessage}</p> : null}
              </div>

              <div className={styles.addCardFormFooter}>
                <button
                  type="button"
                  className={styles.addCardSubmit}
                  onClick={onSubmit}
                  disabled={!newCardText.trim() || isSubmitting}
                  tabIndex={addingCard ? 0 : -1}
                >
                  Adicionar cartão
                </button>
                <button
                  type="button"
                  className={styles.addCardDismiss}
                  onClick={onDismiss}
                  disabled={isSubmitting}
                  aria-label="Cancelar novo cartão"
                  tabIndex={addingCard ? 0 : -1}
                >
                  <X size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
