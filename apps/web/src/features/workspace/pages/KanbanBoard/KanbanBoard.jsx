import { useCallback, useEffect, useMemo, useState } from 'react'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import CardModal from '../../components/CardModal/CardModal.jsx'
import AddColumnComposer from '../../components/AddColumnComposer/AddColumnComposer.jsx'
import BoardHeader from '../../components/BoardHeader/BoardHeader.jsx'
import KanbanColumn from '../../components/KanbanColumn/KanbanColumn.jsx'
import KanbanCard from '../../components/KanbanCard/KanbanCard.jsx'
import { usePlans } from '../../context/PlansContext.jsx'
import { useBoardColumns } from '../../hooks/useBoardColumns.js'
import { useKanbanBoardDnd } from '../../hooks/useKanbanBoardDnd.js'
import { useResolvedPlanRoute } from '../../hooks/useResolvedPlanRoute.js'
import { CalendarWorkspaceView } from '../../../calendar/components/CalendarWorkspaceView/CalendarWorkspaceView.jsx'
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import {
  KANBAN_ADD_LIST_COLOR_OPTIONS,
  KANBAN_DEFAULT_LABELS,
  resolveKanbanAccentColor,
  resolveKanbanAccentForeground,
} from '../../data/kanbanColorPalette.js'
import {
  KANBAN_COLUMN_STATUS_OPTIONS,
  KANBAN_DEFAULT_COLUMN_STATUS,
} from '../../data/kanbanColumnStatusOptions.js'
import { useAuthenticatedImageUrl } from '../../../../shared/hooks/useAuthenticatedImageUrl.js'
import BoardLoadingState from './components/BoardLoadingState.jsx'
import KanbanBoardInboxPanel from './components/KanbanBoardInboxPanel.jsx'
import KanbanBoardPlannerPanel from './components/KanbanBoardPlannerPanel.jsx'
import KanbanBoardIntelligencePanel from './components/KanbanBoardIntelligencePanel.jsx'
import { useKanbanBoardNotification } from './hooks/useKanbanBoardNotification.js'
import { useKanbanBoardFloatingPanels } from './hooks/useKanbanBoardFloatingPanels.js'
import { useKanbanBoardCardActions } from './hooks/useKanbanBoardCardActions.js'
import { useKanbanBoardFiles } from './hooks/useKanbanBoardFiles.js'
import { useKanbanBoardInbox } from './hooks/useKanbanBoardInbox.js'
import { useKanbanBoardPlanner } from './hooks/useKanbanBoardPlanner.js'
import { useKanbanBoardIntelligence } from './hooks/useKanbanBoardIntelligence.js'
import styles from './KanbanBoard.module.css'

const MEMBERS = [
  { id: 'm1', initials: 'AS', color: '#000' },
  { id: 'm2', initials: 'MK', color: '#d4aef1' },
  { id: 'm3', initials: 'TK', color: '#4290da' },
  { id: 'm4', initials: 'SR', color: '#0f703a' },
]

export default function KanbanBoard() {
  const { planId } = useParams()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { accessToken, currentUser } = useAuth()
  const {
    updatePlanBoard,
    isBackendDriven,
    loadPlanBoard,
    applyBoardView,
    ensurePlanDetails,
    refreshPlanDetails,
    isLoading,
  } = usePlans()
  const { activePlan } = useResolvedPlanRoute({
    planId,
    buildPath: buildWorkspaceBoardPath,
  })
  const [boardViewMode, setBoardViewMode] = useState(() => {
    if (location.state?.boardViewMode === 'calendar') return 'calendar'
    return 'kanban'
  })
  const [activeCard, setActiveCard] = useState(null)
  const [addingCol, setAddingCol] = useState(false)
  const [newColTitle, setNewColTitle] = useState('')
  const [newColColor, setNewColColor] = useState('')
  const [newColStatus, setNewColStatus] = useState(KANBAN_DEFAULT_COLUMN_STATUS)
  const [addColumnError, setAddColumnError] = useState(null)
  const [boardLoadError, setBoardLoadError] = useState(null)

  const { notification, showNotification } = useKanbanBoardNotification()
  const {
    isInboxOpen,
    isInboxPanelMounted,
    isPlannerOpen,
    isPlannerPanelMounted,
    isIntelligenceOpen,
    isIntelligencePanelMounted,
    openInbox: openInboxPanel,
    closeInbox: closeInboxPanel,
    openPlanner: openPlannerPanel,
    closePlanner: closePlannerPanel,
    openIntelligence: openIntelligencePanel,
    closeIntelligence,
  } = useKanbanBoardFloatingPanels()

  const { generalPreferences, localPreferences, formatClockTime } = usePreferences()
  const timeZone = generalPreferences.timezone
  const dateFormat = generalPreferences.dateFormat
  const boardAccentColor = resolveKanbanAccentColor(localPreferences?.kanbanAccentColor)
  const boardAccentForeground = resolveKanbanAccentForeground(localPreferences?.kanbanAccentColor)
  const boardAccentStyle = useMemo(() => ({
    '--kanban-accent-color': boardAccentColor,
    '--kanban-accent-foreground': boardAccentForeground,
  }), [boardAccentColor, boardAccentForeground])
  const today = useMemo(() => new Date(), [timeZone])

  const planLabels = activePlan?.labelsMeta?.length ? activePlan.labelsMeta : KANBAN_DEFAULT_LABELS
  const isPlanMembersLoading = Boolean(isBackendDriven && activePlan?.id && !activePlan.detailsLoaded)
  const backendPlanMembers = Array.isArray(activePlan?.membersMeta) ? activePlan.membersMeta : []
  const planMembers = isBackendDriven
    ? backendPlanMembers
    : (activePlan ? (activePlan?.membersMeta?.length ? activePlan.membersMeta : MEMBERS) : [])

  const {
    columns,
    updateColumns,
    createColumn,
    deleteColumn,
    renameColumn,
    changeColColor,
    changeColStatus,
    addCard,
    updateCard,
    deleteCard,
    addCardComment,
    moveCard,
    reorderColumns,
    createChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
  } = useBoardColumns({
    activePlanId: activePlan?.id,
    boardColumns: activePlan?.boardColumns,
    updatePlanBoard,
    isBackendDriven,
    accessToken,
    applyBoardView,
    loadPlanBoard,
    timeZone,
    dateFormat,
  })

  const {
    saveCardOptimistically,
    handleCardUpdate,
    handleCardDelete,
    handleBoardCardClick,
    canMoveActiveCardToNextColumn,
    handleMoveCardToNextColumn,
    togglePlannerCardCompleted,
  } = useKanbanBoardCardActions({
    columns,
    updateColumns,
    updateCard,
    deleteCard,
    moveCard,
    isBackendDriven,
    activePlanId: activePlan?.id,
    activeCard,
    setActiveCard,
    showNotification,
  })

  const {
    inboxRecipientCard,
    inboxSelectedMemberIds,
    inboxSendingCardId,
    inboxError,
    inboxItems,
    isClearingInbox,
    handleInboxCardDrop,
    resetInboxRecipientState,
    clearInboxDeliveries,
    toggleInboxRecipient,
    submitInboxRecipients,
  } = useKanbanBoardInbox({
    activePlan,
    isBackendDriven,
    accessToken,
    ensurePlanDetails,
    isInboxPanelMounted,
    columns,
    updateColumns,
    setActiveCard,
    showNotification,
  })

  const {
    isPlannerFilterOpen,
    setIsPlannerFilterOpen,
    plannerFilter,
    setPlannerFilter,
    plannerFilterWrapRef,
    plannerFilterCounts,
    plannerView,
    togglePlannerPinned,
    togglePlannerSection,
    isPlannerSectionOpen,
  } = useKanbanBoardPlanner({
    activePlan,
    columns,
    currentUser,
    timeZone,
    formatClockTime,
    today,
    isPlannerPanelMounted,
    saveCardOptimistically,
    updateCard,
    showNotification,
  })

  const {
    planFiles,
    libraryFiles,
    filesLoading,
    filesError,
    reloadFileLists,
    attachFileToCard,
    uploadLocalFileToCard,
    removeAttachmentFromCard,
    downloadFile,
  } = useKanbanBoardFiles({
    activePlanId: activePlan?.id,
    isBackendDriven,
    accessToken,
    columns,
    updateColumns,
    activeCard,
    setActiveCard,
    showNotification,
  })

  const {
    intelligenceDraft,
    setIntelligenceDraft,
    kanbanAiChips,
    setKanbanAiChips,
    intelligenceActiveConnectors,
    intelligenceMessages,
    isIntelligenceThinking,
    hasIntelligenceConversation,
    submitIntelligenceMessage,
    canSubmitIntelligenceMessage,
    composerContext,
    intelligencePanelRef,
    intelligenceComposerInputRef,
    intelligencePanelStyle,
  } = useKanbanBoardIntelligence({
    accessToken,
    activePlan,
    columns,
    isIntelligenceOpen,
    isIntelligencePanelMounted,
    boardAccentColor,
    boardAccentForeground,
    closeIntelligence,
  })

  const inboxAssignedMemberIds = new Set(inboxRecipientCard?.memberIds ?? [])
  const inboxSelectableMembers = planMembers.length
    ? planMembers.filter((member) => !inboxAssignedMemberIds.has(member.id))
    : []

  const closeInbox = useCallback(() => {
    resetInboxRecipientState()
    closeInboxPanel()
  }, [closeInboxPanel, resetInboxRecipientState])

  const closePlanner = useCallback(() => {
    setIsPlannerFilterOpen(false)
    closePlannerPanel()
  }, [closePlannerPanel, setIsPlannerFilterOpen])

  const openIntelligence = useCallback(() => {
    openIntelligencePanel(() => setIsPlannerFilterOpen(false))
  }, [openIntelligencePanel, setIsPlannerFilterOpen])

  const {
    sensors,
    collisionDetection,
    activeDragCard,
    activeDragColumn,
    dragOverColumnId,
    isInboxDropActive,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useKanbanBoardDnd({
    activePlanId: activePlan?.id,
    columns,
    updateColumns,
    moveCard,
    reorderColumns,
    isBackendDriven,
    onMoveError: (error) => showNotification(error?.message ?? 'Não foi possível mover o cartão.'),
    onReorderError: (error) => showNotification(error?.message ?? 'Não foi possível reordenar as listas.'),
    onInboxDrop: handleInboxCardDrop,
  })

  const addColumn = async () => {
    const nextTitle = newColTitle.trim()
    if (!nextTitle) return

    const nextColor = newColColor
    const nextStatus = newColStatus

    setNewColTitle('')
    setNewColColor('')
    setNewColStatus(KANBAN_DEFAULT_COLUMN_STATUS)
    setAddingCol(false)
    setAddColumnError(null)

    try {
      await createColumn(nextTitle, { color: nextColor, status: nextStatus })
    } catch (error) {
      const message = error?.message ?? 'Não foi possível criar a lista.'
      setNewColTitle(nextTitle)
      setNewColColor(nextColor)
      setNewColStatus(nextStatus)
      setAddingCol(true)
      setAddColumnError(message)
      showNotification(message)
    }
  }

  useEffect(() => {
    const cardIdFromUrl = String(searchParams.get('card') ?? '').trim()
    if (!cardIdFromUrl || !columns.length) return

    for (const column of columns) {
      const card = column.cards?.find((item) => item.id === cardIdFromUrl)
      if (card) {
        setActiveCard({ card, colTitle: column.title })
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete('card')
        setSearchParams(nextParams, { replace: true })
        break
      }
    }
  }, [columns, searchParams, setSearchParams])

  useEffect(() => {
    setBoardLoadError(null)
    if (!activePlan?.id || !isBackendDriven) return

    loadPlanBoard(activePlan.id).catch((error) => {
      setBoardLoadError(error?.message ?? 'Não foi possível carregar o quadro deste plano.')
    })
  }, [activePlan?.id, isBackendDriven, loadPlanBoard])

  const retryLoadBoard = async () => {
    if (!activePlan?.id || !isBackendDriven) return

    setBoardLoadError(null)
    try {
      await loadPlanBoard(activePlan.id)
    } catch (error) {
      setBoardLoadError(error?.message ?? 'Não foi possível carregar o quadro deste plano.')
    }
  }

  const handleColumnDelete = async (colId) => {
    try {
      await deleteColumn(colId)
    } catch (error) {
      showNotification(error?.message ?? 'Não foi possível excluir a lista.')
    }
  }

  const handleColumnColorChange = (colId, color) => {
    changeColColor(colId, color).catch((error) => {
      showNotification(error?.message ?? 'Não foi possível alterar a cor da lista.')
    })
  }

  const handleColumnStatusChange = (colId, status) => {
    changeColStatus(colId, status).catch((error) => {
      showNotification(error?.message ?? 'Não foi possível alterar o status da lista.')
    })
  }

  useEffect(() => {
    if (!location.state?.openIntelligence) return
    openIntelligence()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.openIntelligence])

  useEffect(() => {
    if (!location.state?.openInbox) return
    openInboxPanel()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.openInbox])

  useEffect(() => {
    if (!location.state?.openPlanner) return
    openPlannerPanel(() => setIsPlannerFilterOpen(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.openPlanner])

  const closeFloatingPanelWithCleanup = useCallback(() => {
    resetInboxRecipientState()
    closeInboxPanel()
    setIsPlannerFilterOpen(false)
    closePlannerPanel()
    closeIntelligence()
  }, [closeInboxPanel, closeIntelligence, closePlannerPanel, resetInboxRecipientState, setIsPlannerFilterOpen])

  const showCalendarView = () => {
    setBoardViewMode('calendar')
    closeFloatingPanelWithCleanup()
  }

  const hasNoPlan = isBackendDriven && !isLoading && !activePlan
  const isBoardLoading = isBackendDriven && !hasNoPlan && !boardLoadError && (isLoading || !activePlan?.boardLoaded)
  const coverThemeClassName = activePlan?.coverThemeId ? (styles[`theme${activePlan.coverThemeId}`] ?? '') : ''
  const rawCoverImageUrl = activePlan?.coverImage ?? null
  const isImageCover = Boolean(rawCoverImageUrl)
  const resolvedCoverImageUrl = useAuthenticatedImageUrl(isImageCover ? rawCoverImageUrl : null)
  const hasPlanCover = Boolean(coverThemeClassName || isImageCover)
  const boardMainClassName = [
    styles.boardMain,
    hasPlanCover ? styles.boardMainHasCover : '',
    coverThemeClassName,
    isImageCover ? styles.boardMainImageCover : '',
  ].filter(Boolean).join(' ')
  const boardCoverStyle = activePlan?.coverThemeId
    ? {
        '--cover-fallback': activePlan.cover,
      }
    : isImageCover && resolvedCoverImageUrl
      ? {
          '--cover-bg': `url(${resolvedCoverImageUrl})`,
        }
      : undefined


  return (
    <AppThemeScope>
      <div className={styles.boardAccentScope} style={boardAccentStyle}>
      <ProductAppShell
        contentClassName={styles.boardPageShell}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
        <div className={styles.boardPageLayout}>
        <div
          className={`${styles.boardWrapper} ${isPlannerPanelMounted || isInboxPanelMounted ? styles.boardWrapperPlannerMounted : ''} ${isPlannerOpen || isInboxOpen ? styles.boardWrapperWithPlanner : ''}`}
        >
        <div className={boardMainClassName} style={boardCoverStyle}>
        <section className={styles.boardBody}>
          <div className={styles.boardBodyContent}>
            <BoardHeader
              planName={activePlan?.name ?? 'Plano'}
              plan={activePlan}
              viewMode={boardViewMode === 'calendar' ? 'kanban' : boardViewMode}
              onViewModeChange={(nextViewMode) => {
                setBoardViewMode(nextViewMode)
                closeFloatingPanelWithCleanup()
              }}
              members={planMembers}
              isMembersLoading={isPlanMembersLoading}
              isBackendDriven={isBackendDriven}
              accessToken={accessToken}
              onRefreshPlanDetails={refreshPlanDetails}
              onNotify={showNotification}
            />

            {isBoardLoading ? (
              <BoardLoadingState styles={styles} />
            ) : hasNoPlan ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Nenhum plano ativo no momento</p>
                <p className={styles.boardStatusText}>Quando houver um plano disponível, o quadro será exibido aqui.</p>
              </section>
            ) : boardLoadError ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Não foi possível carregar o quadro</p>
                <p className={styles.boardStatusText}>{boardLoadError}</p>
                <button type="button" className={styles.boardStatusRetry} onClick={retryLoadBoard}>
                  Tentar novamente
                </button>
              </section>
            ) : boardViewMode === 'calendar' ? (
              <CalendarWorkspaceView embedded />
            ) : boardViewMode === 'timeline' ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Timeline</p>
                <p className={styles.boardStatusText}>Este modo de visualização estará disponível em breve.</p>
              </section>
            ) : boardViewMode === 'bugtrack' ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Bugtrack</p>
                <p className={styles.boardStatusText}>Este modo de visualização estará disponível em breve.</p>
              </section>
            ) : boardViewMode === 'actions' ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Actions</p>
                <p className={styles.boardStatusText}>Este modo de visualização estará disponível em breve.</p>
              </section>
            ) : (
              <SortableContext
                items={columns.map((column) => column.id)}
                strategy={horizontalListSortingStrategy}
              >
              <div className={styles.board}>
                {columns.map(col => (
                  <KanbanColumn
                    key={col.uiKey ?? col.id}
                    col={col}
                    isDropTarget={dragOverColumnId === col.id}
                    onAddCard={addCard}
                    onDeleteCol={handleColumnDelete}
                    onRenameCol={renameColumn}
                    onChangeColColor={handleColumnColorChange}
                    onChangeColStatus={handleColumnStatusChange}
                    statusOptions={KANBAN_COLUMN_STATUS_OPTIONS}
                    onCardClick={handleBoardCardClick}
                    onToggleCardCompleted={togglePlannerCardCompleted}
                    labels={planLabels}
                    members={planMembers}
                    colorOptions={KANBAN_ADD_LIST_COLOR_OPTIONS}
                    styles={styles}
                  />
                ))}

                <AddColumnComposer
                  addingCol={addingCol}
                  newColTitle={newColTitle}
                  setNewColTitle={(value) => {
                    setNewColTitle(value)
                    if (addColumnError) {
                      setAddColumnError(null)
                    }
                  }}
                  newColColor={newColColor}
                  setNewColColor={setNewColColor}
                  colorOptions={KANBAN_ADD_LIST_COLOR_OPTIONS}
                  newColStatus={newColStatus}
                  setNewColStatus={setNewColStatus}
                  statusOptions={KANBAN_COLUMN_STATUS_OPTIONS}
                  defaultColumnStatus={KANBAN_DEFAULT_COLUMN_STATUS}
                  setAddingCol={setAddingCol}
                  addColumn={addColumn}
                  errorMessage={addColumnError}
                  styles={styles}
                />
              </div>
              </SortableContext>
            )}
          </div>
        </section>

        {isIntelligencePanelMounted ? (
          <KanbanBoardIntelligencePanel
            styles={styles}
            isIntelligenceOpen={isIntelligenceOpen}
            hasIntelligenceConversation={hasIntelligenceConversation}
            intelligencePanelRef={intelligencePanelRef}
            intelligencePanelStyle={intelligencePanelStyle}
            intelligenceMessages={intelligenceMessages}
            isIntelligenceThinking={isIntelligenceThinking}
            intelligenceDraft={intelligenceDraft}
            setIntelligenceDraft={setIntelligenceDraft}
            intelligenceComposerInputRef={intelligenceComposerInputRef}
            submitIntelligenceMessage={submitIntelligenceMessage}
            canSubmitIntelligenceMessage={canSubmitIntelligenceMessage}
            kanbanAiChips={kanbanAiChips}
            setKanbanAiChips={setKanbanAiChips}
            composerContext={composerContext}
            intelligenceActiveConnectors={intelligenceActiveConnectors}
          />
        ) : null}
        </div>

        {isInboxPanelMounted ? (
          <KanbanBoardInboxPanel
            styles={styles}
            isInboxOpen={isInboxOpen}
            isInboxDropActive={isInboxDropActive}
            closeInbox={closeInbox}
            inboxRecipientCard={inboxRecipientCard}
            inboxSelectedMemberIds={inboxSelectedMemberIds}
            inboxSendingCardId={inboxSendingCardId}
            inboxError={inboxError}
            inboxItems={inboxItems}
            isClearingInbox={isClearingInbox}
            inboxSelectableMembers={inboxSelectableMembers}
            isPlanMembersLoading={isPlanMembersLoading}
            onResetRecipient={resetInboxRecipientState}
            onToggleRecipient={toggleInboxRecipient}
            onSubmitRecipients={submitInboxRecipients}
            onClearDeliveries={clearInboxDeliveries}
          />
        ) : null}

        {isPlannerPanelMounted ? (
          <KanbanBoardPlannerPanel
            styles={styles}
            isPlannerOpen={isPlannerOpen}
            closePlanner={closePlanner}
            plannerFilter={plannerFilter}
            setPlannerFilter={setPlannerFilter}
            isPlannerFilterOpen={isPlannerFilterOpen}
            setIsPlannerFilterOpen={setIsPlannerFilterOpen}
            plannerFilterWrapRef={plannerFilterWrapRef}
            plannerFilterCounts={plannerFilterCounts}
            plannerView={plannerView}
            isPlannerSectionOpen={isPlannerSectionOpen}
            togglePlannerSection={togglePlannerSection}
            togglePlannerPinned={togglePlannerPinned}
            togglePlannerCardCompleted={togglePlannerCardCompleted}
            onOpenCard={setActiveCard}
            onShowCalendarView={showCalendarView}
          />
        ) : null}
        </div>
        </div>
        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
          {activeDragCard ? (
            <KanbanCard
              card={activeDragCard.card}
              colId={activeDragCard.columnId}
              colTitle={activeDragCard.columnTitle}
              isDragOverlay
              isConfirmed={Boolean(activeDragCard.card.isCompleted)}
              labels={planLabels}
              members={planMembers}
              styles={styles}
            />
          ) : activeDragColumn ? (
            <KanbanColumn
              col={activeDragColumn}
              isDragOverlay
              onAddCard={() => {}}
              onDeleteCol={() => {}}
              onRenameCol={() => {}}
              onChangeColColor={() => {}}
              onChangeColStatus={() => {}}
              statusOptions={KANBAN_COLUMN_STATUS_OPTIONS}
              onCardClick={() => {}}
              labels={planLabels}
              members={planMembers}
              colorOptions={KANBAN_ADD_LIST_COLOR_OPTIONS}
              styles={styles}
            />
          ) : null}
        </DragOverlay>
        </DndContext>
      </ProductAppShell>

      {activeCard && (
        <CardModal
          card={activeCard.card}
          colTitle={activeCard.colTitle}
          onClose={() => setActiveCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
          onMoveToNextColumn={handleMoveCardToNextColumn}
          canMoveToNextColumn={canMoveActiveCardToNextColumn}
          onToggleCardCompleted={togglePlannerCardCompleted}
          onAddComment={isBackendDriven ? addCardComment : undefined}
          labels={planLabels}
          members={planMembers}
          currentUser={currentUser}
          styles={styles}
          isBackendDriven={isBackendDriven}
          planFiles={planFiles}
          libraryFiles={libraryFiles}
          filesLoading={filesLoading}
          filesError={filesError}
          onLoadFiles={reloadFileLists}
          onAttachFile={attachFileToCard}
          onUploadLocalFile={uploadLocalFileToCard}
          onRemoveAttachment={removeAttachmentFromCard}
          onDownloadFile={downloadFile}
          onCreateChecklist={createChecklist}
          onDeleteChecklist={deleteChecklist}
          onCreateChecklistItem={createChecklistItem}
          onUpdateChecklistItem={updateChecklistItem}
          timeZone={timeZone}
          dateFormat={dateFormat}
        />
      )}

      {notification && (
        <div className={styles.boardNotification} role="status" aria-live="polite">
          {notification}
        </div>
      )}
      </div>
    </AppThemeScope>
  )
}
