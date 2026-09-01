import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import {
  Calendar,
  ChevronDown,
  Clock,
  Tag,
  UserRound,
  X,
} from 'lucide-react'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import {
  BOARD_FILTER_DEFAULTS,
  BOARD_FILTER_MATCH_MODES,
  toggleBoardFilterLabelId,
  toggleBoardFilterMemberId,
} from './boardFilterDefaults.js'
import styles from './BoardFilterPopover.module.css'

const ICON_SIZE = 15
const ICON_STROKE = 1.75
const TRAILING_ICON_SIZE = 13

function resolveMemberLabel(member) {
  return member?.label ?? member?.name ?? member?.fullName ?? member?.email ?? member?.initials ?? ''
}

function renderMemberAvatar(member, className) {
  return (
    <AuthenticatedAvatar
      avatarUrl={member?.avatarUrl}
      fallback={member?.initials}
      className={className}
      imageClassName={styles.memberAvatarImage}
      style={{ background: member?.color }}
      alt={resolveMemberLabel(member)}
    />
  )
}

function FilterCheckbox({ checked, onChange, children, className = '' }) {
  return (
    <label
      className={[styles.optionRow, className].filter(Boolean).join(' ')}
      onMouseDown={(event) => event.preventDefault()}
    >
      <input
        type="checkbox"
        className={styles.checkboxInput}
        checked={checked}
        tabIndex={-1}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className={styles.optionIcon} aria-hidden="true">
        <span className={styles.checkboxBox} />
      </span>
      <span className={styles.optionLabel}>{children}</span>
    </label>
  )
}

function FilterSection({ title, children }) {
  return (
    <section className={styles.section}>
      {title ? <h3 className={styles.sectionTitle}>{title}</h3> : null}
      <div className={styles.sectionBody}>{children}</div>
    </section>
  )
}

function DueDateOption({ id, label, tone, checked, onChange }) {
  return (
    <FilterCheckbox checked={checked} onChange={(next) => onChange(id, next)}>
      <span className={[styles.optionIcon, styles[`dueDateIcon${tone}`]].filter(Boolean).join(' ')} aria-hidden="true">
        {tone === 'none' ? (
          <Calendar size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        ) : (
          <Clock size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        )}
      </span>
      <span>{label}</span>
    </FilterCheckbox>
  )
}

export default function BoardFilterPopover({
  open,
  filter = BOARD_FILTER_DEFAULTS,
  labels = [],
  members = [],
  currentUser = null,
  onFilterChange,
  onClose,
}) {
  const titleId = useId()
  const matchModeWrapRef = useRef(null)
  const bodyViewportRef = useRef(null)
  const pendingScrollTopRef = useRef(null)
  const [isMembersExpanded, setIsMembersExpanded] = useState(false)
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(false)
  const [isMatchModeOpen, setIsMatchModeOpen] = useState(false)

  useLayoutEffect(() => {
    if (pendingScrollTopRef.current === null || !bodyViewportRef.current) return

    bodyViewportRef.current.scrollTop = pendingScrollTopRef.current
    pendingScrollTopRef.current = null
  })

  useEffect(() => {
    if (!isMatchModeOpen) return undefined

    const handlePointerDown = (event) => {
      if (matchModeWrapRef.current?.contains(event.target)) return
      setIsMatchModeOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isMatchModeOpen])

  if (!open) return null

  const resolvedFilter = { ...BOARD_FILTER_DEFAULTS, ...filter }
  const currentUserId = currentUser?.id ?? null
  const selectableMembers = members.filter((member) => member.id !== currentUserId)
  const visibleLabels = labels.slice(0, isLabelsExpanded ? labels.length : 3)
  const activeMatchMode = BOARD_FILTER_MATCH_MODES.find((mode) => mode.id === resolvedFilter.matchMode)
    ?? BOARD_FILTER_MATCH_MODES[0]

  const commitFilterChange = (nextFilter) => {
    if (bodyViewportRef.current) {
      pendingScrollTopRef.current = bodyViewportRef.current.scrollTop
    }

    onFilterChange?.(nextFilter)
  }

  const updateFilter = (patch) => {
    commitFilterChange({
      ...resolvedFilter,
      ...patch,
    })
  }

  const updateNestedFilter = (section, patch) => {
    updateFilter({
      [section]: {
        ...resolvedFilter[section],
        ...patch,
      },
    })
  }

  const toggleDueDate = (id, checked) => {
    updateNestedFilter('dueDate', { [id]: checked })
  }

  const toggleActivity = (id, checked) => {
    updateNestedFilter('activity', { [id]: checked })
  }

  const handleSelectMatchMode = (matchModeId) => {
    updateFilter({ matchMode: matchModeId })
    setIsMatchModeOpen(false)
  }

  return (
    <div
      className={styles.popover}
      role="dialog"
      aria-labelledby={titleId}
      aria-modal="false"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>Filtro</h2>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Fechar"
          onClick={onClose}
        >
          <X size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      </header>

      <CustomScrollArea
        enabled
        className={styles.bodyScrollArea}
        viewportClassName={styles.body}
        viewportRef={bodyViewportRef}
        refreshKey={`${labels.length}:${members.length}:${isMembersExpanded}:${isLabelsExpanded}`}
      >
        <FilterSection title="Palavra-chave">
          <div className={styles.keywordField}>
            <input
              type="search"
              className={styles.keywordInput}
              value={resolvedFilter.keyword}
              placeholder="Insira uma palavra-chave..."
              onChange={(event) => updateFilter({ keyword: event.target.value })}
            />
            <p className={styles.keywordHint}>
              Pesquise cartões, membros, etiquetas e muito mais.
            </p>
          </div>
        </FilterSection>

        <FilterSection title="Membros">
          <FilterCheckbox
            checked={resolvedFilter.members.noMembers}
            onChange={(checked) => updateNestedFilter('members', { noMembers: checked })}
          >
            <span className={styles.optionIcon} aria-hidden="true">
              <UserRound size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            </span>
            <span>Sem membros</span>
          </FilterCheckbox>

          {currentUserId ? (
            <FilterCheckbox
              checked={resolvedFilter.members.assignedToMe}
              onChange={(checked) => updateNestedFilter('members', { assignedToMe: checked })}
            >
              {renderMemberAvatar(currentUser, styles.memberAvatar)}
              <span>Cartões atribuídos a mim</span>
            </FilterCheckbox>
          ) : null}

          {members.length > 0 ? (
            <>
              <button
                type="button"
                className={styles.optionRowWithTrailing}
                aria-expanded={isMembersExpanded}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setIsMembersExpanded((expanded) => !expanded)}
              >
                <span className={styles.optionIcon} aria-hidden="true" />
                <span className={styles.optionLabel}>Selecionar membros</span>
                <ChevronDown
                  size={TRAILING_ICON_SIZE}
                  strokeWidth={ICON_STROKE}
                  className={`${styles.optionTrailing} ${isMembersExpanded ? styles.optionTrailingOpen : ''}`}
                  aria-hidden="true"
                />
              </button>

              {isMembersExpanded ? (
                <div className={styles.nestedOptions}>
                  {selectableMembers.map((member) => (
                    <FilterCheckbox
                      key={member.id}
                      checked={resolvedFilter.members.selectedMemberIds.includes(member.id)}
                      onChange={() => commitFilterChange(toggleBoardFilterMemberId(resolvedFilter, member.id))}
                      className={styles.nestedOptionRow}
                    >
                      {renderMemberAvatar(member, styles.memberAvatar)}
                      <span>{resolveMemberLabel(member)}</span>
                    </FilterCheckbox>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </FilterSection>

        <FilterSection title="Status do cartão">
          <FilterCheckbox
            checked={resolvedFilter.status.completed}
            onChange={(checked) => updateNestedFilter('status', { completed: checked })}
          >
            <span>Marcado como concluído</span>
          </FilterCheckbox>
          <FilterCheckbox
            checked={resolvedFilter.status.notCompleted}
            onChange={(checked) => updateNestedFilter('status', { notCompleted: checked })}
          >
            <span>Não marcado como concluído</span>
          </FilterCheckbox>
        </FilterSection>

        <FilterSection title="Data de entrega">
          <DueDateOption
            id="noDates"
            label="Sem datas"
            tone="none"
            checked={resolvedFilter.dueDate.noDates}
            onChange={toggleDueDate}
          />
          <DueDateOption
            id="overdue"
            label="Atrasado"
            tone="Overdue"
            checked={resolvedFilter.dueDate.overdue}
            onChange={toggleDueDate}
          />
          <DueDateOption
            id="dueInDay"
            label="A ser entregue em um dia"
            tone="Day"
            checked={resolvedFilter.dueDate.dueInDay}
            onChange={toggleDueDate}
          />
          <DueDateOption
            id="dueInWeek"
            label="A ser entregue em uma semana"
            tone="Muted"
            checked={resolvedFilter.dueDate.dueInWeek}
            onChange={toggleDueDate}
          />
          <DueDateOption
            id="dueInMonth"
            label="A ser entregue em um mês"
            tone="Muted"
            checked={resolvedFilter.dueDate.dueInMonth}
            onChange={toggleDueDate}
          />
        </FilterSection>

        <FilterSection title="Etiquetas">
          <FilterCheckbox
            checked={resolvedFilter.labels.noLabels}
            onChange={(checked) => updateNestedFilter('labels', { noLabels: checked })}
          >
            <span className={styles.optionIcon} aria-hidden="true">
              <Tag size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            </span>
            <span>Sem etiquetas</span>
          </FilterCheckbox>

          {visibleLabels.map((label) => (
            <FilterCheckbox
              key={label.id}
              checked={resolvedFilter.labels.selectedLabelIds.includes(label.id)}
              onChange={() => commitFilterChange(toggleBoardFilterLabelId(resolvedFilter, label.id))}
            >
              <span
                className={styles.optionLabelPill}
                style={{ backgroundColor: label.color }}
              >
                {label.text}
              </span>
            </FilterCheckbox>
          ))}

          {labels.length > 3 ? (
            <button
              type="button"
              className={styles.optionRowWithTrailing}
              aria-expanded={isLabelsExpanded}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setIsLabelsExpanded((expanded) => !expanded)}
            >
              <span className={styles.optionIcon} aria-hidden="true" />
              <span className={styles.optionLabel}>Selecionar etiquetas</span>
              <ChevronDown
                size={TRAILING_ICON_SIZE}
                strokeWidth={ICON_STROKE}
                className={`${styles.optionTrailing} ${isLabelsExpanded ? styles.optionTrailingOpen : ''}`}
                aria-hidden="true"
              />
            </button>
          ) : null}
        </FilterSection>

        <FilterSection title="Atividade">
          <FilterCheckbox
            checked={resolvedFilter.activity.activeLastWeek}
            onChange={(checked) => toggleActivity('activeLastWeek', checked)}
          >
            <span>Ativo na semana passada</span>
          </FilterCheckbox>
          <FilterCheckbox
            checked={resolvedFilter.activity.activeLastTwoWeeks}
            onChange={(checked) => toggleActivity('activeLastTwoWeeks', checked)}
          >
            <span>Ativo nas últimas duas semanas</span>
          </FilterCheckbox>
          <FilterCheckbox
            checked={resolvedFilter.activity.activeLastFourWeeks}
            onChange={(checked) => toggleActivity('activeLastFourWeeks', checked)}
          >
            <span>Ativo nas últimas quatro semanas</span>
          </FilterCheckbox>
          <FilterCheckbox
            checked={resolvedFilter.activity.noActivityLastFourWeeks}
            onChange={(checked) => toggleActivity('noActivityLastFourWeeks', checked)}
          >
            <span>Sem atividade nas últimas quatro semanas</span>
          </FilterCheckbox>
        </FilterSection>
      </CustomScrollArea>

      <div className={styles.matchModeBar}>
        <div className={styles.matchModeDivider} role="separator" />

        <div ref={matchModeWrapRef} className={styles.matchModeControl}>
          {isMatchModeOpen ? (
            <div className={styles.matchModeMenu} role="listbox" aria-label="Modo de correspondência">
              {BOARD_FILTER_MATCH_MODES.map(({ id, label, description }) => {
                const isActive = resolvedFilter.matchMode === id

                return (
                  <button
                    key={id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={[
                      styles.matchModeOption,
                      isActive ? styles.matchModeOptionActive : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleSelectMatchMode(id)}
                  >
                    <span className={styles.matchModeOptionAccent} aria-hidden="true" />
                    <span className={styles.matchModeOptionBody}>
                      <span className={styles.matchModeOptionTitle}>{label}</span>
                      <span className={styles.matchModeOptionDescription}>{description}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : null}

          <button
            type="button"
            className={styles.matchModeButton}
            aria-haspopup="listbox"
            aria-expanded={isMatchModeOpen}
            onClick={() => setIsMatchModeOpen((open) => !open)}
          >
            <span className={styles.matchModeButtonLabel}>{activeMatchMode.label}</span>
            <ChevronDown
              size={12}
              strokeWidth={ICON_STROKE}
              className={`${styles.matchModeChevron} ${isMatchModeOpen ? styles.matchModeChevronOpen : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
  )
}
