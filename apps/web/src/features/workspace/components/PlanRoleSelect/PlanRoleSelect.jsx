import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Shield, User } from 'lucide-react'
import styles from './PlanRoleSelect.module.css'

const MENU_GAP = 6

const ROLE_ICONS = {
  MEMBER: User,
  ADMIN: Shield,
  OWNER: Shield,
}

function RoleIcon({ role, className }) {
  const Icon = ROLE_ICONS[role] ?? User
  return <Icon size={13} strokeWidth={1.75} className={className} aria-hidden="true" />
}

export default function PlanRoleSelect({
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel = 'Nível de permissão',
  variant = 'default',
  onOpenChange = null,
}) {
  const menuId = useId()
  const fieldRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const selectedOption = options.find((option) => option.value === value) ?? options[0]
  const isInteractive = !disabled && options.length > 1
  const isInline = variant === 'inline'

  const setOpen = (nextOpen) => {
    setIsOpen(nextOpen)
    onOpenChangeRef.current?.(nextOpen)
  }

  useLayoutEffect(() => {
    if (!isOpen || isInline) {
      setMenuStyle(null)
      return undefined
    }

    const updatePosition = () => {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!trigger || !menu) return

      const triggerRect = trigger.getBoundingClientRect()
      const menuHeight = menu.offsetHeight
      const menuWidth = Math.max(menu.scrollWidth, triggerRect.width)
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
  }, [isOpen, options.length, isInline])

  useEffect(() => {
    if (!disabled || !isOpen) return
    setOpen(false)
  }, [disabled, isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (fieldRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isOpen])

  return (
    <div
      className={[
        styles.wrap,
        isOpen ? styles.wrapOpen : '',
        isInline ? styles.wrapInline : '',
      ].filter(Boolean).join(' ')}
      ref={fieldRef}
    >
      <button
        type="button"
        id={menuId}
        ref={triggerRef}
        className={[
          styles.trigger,
          isOpen ? styles.triggerOpen : '',
          isInline ? styles.triggerInline : '',
        ].filter(Boolean).join(' ')}
        onClick={() => {
          if (!isInteractive) return
          setOpen(!isOpen)
        }}
        aria-label={ariaLabel}
        aria-haspopup={isInteractive ? 'listbox' : undefined}
        aria-expanded={isInteractive ? isOpen : undefined}
        aria-controls={isInteractive ? `${menuId}-menu` : undefined}
        disabled={disabled}
      >
        <span className={styles.triggerContent}>
          <RoleIcon role={selectedOption?.value} className={styles.triggerIcon} />
          <span className={styles.triggerLabel}>{selectedOption?.label}</span>
        </span>
        {isInteractive ? (
          <ChevronDown size={12} strokeWidth={1.75} className={styles.chevron} aria-hidden="true" />
        ) : null}
      </button>

      {isOpen && isInteractive ? (
        <div
          id={`${menuId}-menu`}
          ref={menuRef}
          className={isInline ? styles.menuInline : styles.menu}
          role="listbox"
          aria-label={ariaLabel}
          style={isInline ? undefined : (menuStyle ?? { position: 'fixed', visibility: 'hidden' })}
        >
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={[
                  styles.option,
                  isInline ? styles.optionInline : '',
                  isSelected ? styles.optionSelected : '',
                ].filter(Boolean).join(' ')}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <span className={styles.optionContent}>
                  <RoleIcon role={option.value} className={styles.optionIcon} />
                  <span className={styles.optionLabel}>{option.label}</span>
                </span>
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
