import { useEffect, useId, useRef, useState } from 'react'
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

const ICON_SIZE = 13
const ICON_STROKE = 1.75

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
    <label className={[styles.checkboxRow, className].filter(Boolean).join(' ')}>
      <input
        type="checkbox"
        className={styles.checkboxInput}
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className={styles.checkboxBox} aria-hidden="true" />
      <span className={styles.checkboxContent}>{children}</span>
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
      <span className={[styles.dueDateIcon, styles[`dueDateIcon${tone}`]].filter(Boolean).join(' ')} aria-hidden="true">
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
  const [isMembersExpanded, setIsMembersExpanded] = useState(false)
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(false)
  const [isMatchModeOpen, setIsMatchModeOpen] = useState(false)

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

  const updateFilter = (patch) => {
    onFilterChange?.({
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
        refreshKey={`${labels.length}:${members.length}:${isMembersExpanded}:${isLabelsExpanded}`}
      >
        <FilterSection title="Palavra-chave">
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
        </FilterSection>

        <FilterSection title="Membros">
          <FilterCheckbox
            checked={resolvedFilter.members.noMembers}
            onChange={(checked) => updateNestedFilter('members', { noMembers: checked })}
          >
            <span className={styles.inlineIcon} aria-hidden="true">
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
                className={styles.expandButton}
                aria-expanded={isMembersExpanded}
                onClick={() => setIsMembersExpanded((expanded) => !expanded)}
              >
                <span className={styles.expandButtonCheckbox} aria-hidden="true" />
                <span>Selecionar membros</span>
                <ChevronDown
                  size={12}
                  strokeWidth={ICON_STROKE}
                  className={`${styles.expandChevron} ${isMembersExpanded ? styles.expandChevronOpen : ''}`}
                  aria-hidden="true"
                />
              </button>

              {isMembersExpanded ? (
                <div className={styles.nestedOptions}>
                  {selectableMembers.map((member) => (
                    <FilterCheckbox
                      key={member.id}
                      checked={resolvedFilter.members.selectedMemberIds.includes(member.id)}
                      onChange={() => onFilterChange?.(toggleBoardFilterMemberId(resolvedFilter, member.id))}
                      className={styles.nestedCheckboxRow}
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
            <span className={styles.inlineIcon} aria-hidden="true">
              <Tag size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            </span>
            <span>Sem etiquetas</span>
          </FilterCheckbox>

          {visibleLabels.map((label) => (
            <FilterCheckbox
              key={label.id}
              className={styles.checkboxRowLabel}
              checked={resolvedFilter.labels.selectedLabelIds.includes(label.id)}
              onChange={() => onFilterChange?.(toggleBoardFilterLabelId(resolvedFilter, label.id))}
            >
              <span
                className={styles.labelPill}
                style={{ backgroundColor: label.color }}
              >
                {label.text}
              </span>
            </FilterCheckbox>
          ))}

          {labels.length > 3 ? (
            <button
              type="button"
              className={styles.expandButton}
              aria-expanded={isLabelsExpanded}
              onClick={() => setIsLabelsExpanded((expanded) => !expanded)}
            >
              <span className={styles.expandButtonCheckbox} aria-hidden="true" />
              <span>Selecionar etiquetas</span>
              <ChevronDown
                size={12}
                strokeWidth={ICON_STROKE}
                className={`${styles.expandChevron} ${isLabelsExpanded ? styles.expandChevronOpen : ''}`}
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
