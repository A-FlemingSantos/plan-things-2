import { KanbanBoardIcons as Icon } from './KanbanBoardIcons.jsx'

export default function KanbanBoardPlannerPanel({
  styles,
  isPlannerOpen,
  closePlanner,
  plannerFilter,
  setPlannerFilter,
  isPlannerFilterOpen,
  setIsPlannerFilterOpen,
  plannerFilterWrapRef,
  plannerFilterCounts,
  plannerView,
  isPlannerSectionOpen,
  togglePlannerSection,
  togglePlannerPinned,
  togglePlannerCardCompleted,
  onOpenCard,
  onShowCalendarView,
}) {
  const plannerFilterOptions = [
    { id: 'my-day', label: 'Meu Dia', Icon: Icon.Sun, count: plannerFilterCounts.myDay, accent: '#4290da' },
    { id: 'important', label: 'Importante', Icon: Icon.Star, count: plannerFilterCounts.important, accent: '#d4aef1' },
    { id: 'planned', label: 'Planejado', Icon: Icon.List, count: plannerFilterCounts.planned, accent: '#0f703a' },
    { id: 'completed', label: 'Concluída', Icon: Icon.CheckCircle, count: plannerFilterCounts.completed, accent: 'var(--text-3)' },
    { id: 'assigned-to-me', label: 'Atribuído a mim', Icon: Icon.User, count: plannerFilterCounts.assignedToMe, accent: '#f5a623' },
  ]

  const activeFilterOption =
    plannerFilterOptions.find((option) => option.id === plannerFilter) ?? plannerFilterOptions[0]

  const totalItems =
    plannerView.ungroupedItems.length +
    plannerView.sections.reduce((sum, section) => sum + section.items.length, 0)

  const renderPlannerItem = (item) => {
    const isCard = item.type === 'card'
    const isEvent = item.type === 'event'
    const itemClassName = [
      styles.plannerListItem,
      item.isCompleted ? styles.plannerListItemCompleted : '',
    ].filter(Boolean).join(' ')

    const activate = () => {
      if (isCard) {
        onOpenCard({ card: item.card, colTitle: item.colTitle })
        return
      }
      if (isEvent) {
        onShowCalendarView()
      }
    }

    return (
      <article
        key={item.id}
        className={itemClassName}
        role="button"
        tabIndex={0}
        onClick={activate}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            activate()
          }
        }}
        aria-label={isCard ? `Abrir tarefa ${item.title}` : `Abrir evento ${item.title}`}
      >
        <div className={styles.plannerListLeft}>
          {isCard ? (
            <button
              type="button"
              className={`${styles.plannerCheckbox} ${item.isCompleted ? styles.plannerCheckboxChecked : ''}`}
              role="checkbox"
              aria-checked={item.isCompleted}
              aria-label={item.isCompleted ? 'Marcar como não concluída' : 'Marcar como concluída'}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                togglePlannerCardCompleted(item.card)
              }}
            >
              {item.isCompleted ? <Icon.Check /> : null}
            </button>
          ) : (
            <span className={styles.plannerEventDot} style={{ background: item.event?.color ?? 'var(--border-2)' }}>
              <Icon.Calendar />
            </span>
          )}
        </div>

        <div className={styles.plannerListBody}>
          <p className={styles.plannerListTitle}>{item.title}</p>
          <p className={styles.plannerListMeta}>{item.meta}</p>
        </div>

        <div className={styles.plannerListRight}>
          <button
            type="button"
            className={`${styles.plannerStarBtn} ${item.pinned ? styles.plannerStarBtnActive : ''}`}
            aria-pressed={item.pinned}
            aria-label={item.pinned ? 'Remover estrela' : 'Marcar com estrela'}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void togglePlannerPinned(item)
            }}
          >
            {item.pinned ? <Icon.StarFill /> : <Icon.Star />}
          </button>
        </div>
      </article>
    )
  }

  const renderPlannerSection = (section) => {
    const expanded = isPlannerSectionOpen(section.id)
    return (
      <div key={section.id} className={styles.plannerSection}>
        <button
          type="button"
          className={styles.plannerSectionHeaderBtn}
          aria-expanded={expanded}
          onClick={() => togglePlannerSection(section.id)}
        >
          <span className={styles.plannerSectionChevron} aria-hidden="true">
            <Icon.Chevron />
          </span>
          <span className={styles.plannerSectionTitle}>{section.title}</span>
          <span className={styles.plannerSectionCount}>{section.items.length}</span>
        </button>
        {expanded ? (
          <div className={styles.plannerSectionBody}>
            {section.items.map(renderPlannerItem)}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <aside
      id="board-planner-panel"
      className={`${styles.plannerPanel} ${isPlannerOpen ? '' : styles.plannerPanelClosing}`}
      aria-label="Planejador"
    >
      <div className={styles.plannerPanelHeader}>
        <div>
          <span className={styles.plannerEyebrow}>Planejador</span>
          <div ref={plannerFilterWrapRef} className={styles.plannerTitleWrap}>
            <button
              type="button"
              className={styles.plannerTitleButton}
              aria-haspopup="menu"
              aria-expanded={isPlannerFilterOpen}
              onClick={() => setIsPlannerFilterOpen((open) => !open)}
            >
              <span>{activeFilterOption.label}</span>
              <span className={styles.plannerTitleChevron} aria-hidden="true">
                <Icon.Chevron />
              </span>
              {activeFilterOption.count ? <span className={styles.plannerTitleCount}>{activeFilterOption.count}</span> : null}
            </button>

            {isPlannerFilterOpen && (
              <div className={styles.plannerFilterMenu} role="menu" aria-label="Filtros do planejador">
                {plannerFilterOptions.map(({ id, label, Icon: ItemIcon, count, accent }) => (
                  <button
                    key={id}
                    type="button"
                    className={`${styles.plannerFilterItem} ${plannerFilter === id ? styles.plannerFilterItemActive : ''}`}
                    style={{ '--planner-filter-accent': accent }}
                    role="menuitem"
                    aria-current={plannerFilter === id ? 'true' : undefined}
                    onClick={() => {
                      setPlannerFilter(id)
                      setIsPlannerFilterOpen(false)
                    }}
                  >
                    <ItemIcon />
                    <span>{label}</span>
                    {count ? <span className={styles.plannerFilterCount}>{count}</span> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          className={styles.plannerCloseButton}
          aria-label="Fechar planejador"
          onClick={closePlanner}
        >
          <Icon.X />
        </button>
      </div>

      <section className={styles.plannerList} aria-label="Itens do planejador">
        {totalItems ? (
          <>
            {plannerView.ungroupedItems.map(renderPlannerItem)}
            {plannerView.sections.map(renderPlannerSection)}
          </>
        ) : (
          <div className={styles.plannerEmptyState}>
            <Icon.Calendar />
            <strong>Nada para mostrar</strong>
            <p>Esse filtro não possui tarefas ou eventos no momento.</p>
          </div>
        )}
      </section>
    </aside>
  )
}
