import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import styles from './PlanRoleSelect.module.css'

const MENU_GAP = 6

export default function PlanRoleSelect({
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel = 'Nível de permissão',
}) {
  const menuId = useId()
  const fieldRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const selectedOption = options.find((option) => option.value === value) ?? options[0]
  const isInteractive = !disabled && options.length > 1

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuStyle(null)
      return undefined
    }

    const updatePosition = () => {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!trigger || !menu) return

      const triggerRect = trigger.getBoundingClientRect()
      const menuHeight = menu.offsetHeight
      const menuWidth = Math.max(menu.offsetWidth, triggerRect.width)
      const spaceBelow = window.innerHeight - triggerRect.bottom - MENU_GAP
      const spaceAbove = triggerRect.top - MENU_GAP
      const opensDown = spaceBelow >= menuHeight || spaceBelow >= spaceAbove
      const top = opensDown
        ? triggerRect.bottom + MENU_GAP
        : triggerRect.top - MENU_GAP - menuHeight
      const left = triggerRect.left

      setMenuStyle({
        position: 'fixed',
        top,
        left,
        width: menuWidth,
        zIndex: 120,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, options.length])

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (fieldRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setIsOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className={`${styles.wrap} ${isOpen ? styles.wrapOpen : ''}`} ref={fieldRef}>
      <button
        type="button"
        id={menuId}
        ref={triggerRef}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => {
          if (!isInteractive) return
          setIsOpen((open) => !open)
        }}
        aria-label={ariaLabel}
        aria-haspopup={isInteractive ? 'listbox' : undefined}
        aria-expanded={isInteractive ? isOpen : undefined}
        aria-controls={isInteractive ? `${menuId}-menu` : undefined}
        disabled={disabled}
      >
        <span className={styles.triggerLabel}>{selectedOption?.label}</span>
        {isInteractive ? (
          <ChevronDown size={12} strokeWidth={1.75} className={styles.chevron} aria-hidden="true" />
        ) : null}
      </button>

      {isOpen && isInteractive ? (
        <div
          id={`${menuId}-menu`}
          ref={menuRef}
          className={styles.menu}
          role="listbox"
          aria-label={ariaLabel}
          style={menuStyle ?? { position: 'fixed', visibility: 'hidden' }}
        >
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                {isSelected ? (
                  <Check size={12} strokeWidth={1.75} className={styles.optionCheck} aria-hidden="true" />
                ) : (
                  <span className={styles.optionCheckPlaceholder} aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
