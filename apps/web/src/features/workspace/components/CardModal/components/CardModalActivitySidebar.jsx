import {
  AtSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Ellipsis,
  Funnel,
  LayoutGrid,
  Paperclip,
  Plus,
  Search,
  SendHorizontal,
  SmilePlus,
  ThumbsUp,
} from 'lucide-react'
import AuthenticatedAvatar from '../../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import CustomScrollArea from '../../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import CardModalChecklist from './CardModalChecklist.jsx'
import { CardModalInlineAttachments } from './CardModalAttachmentControls.jsx'
import CardModalSidebarPicker from './CardModalSidebarPicker.jsx'

const SIDEBAR_PANEL_LABELS = {
  github: 'GitHub',
  activity: 'Activity',
  files: 'Arquivos',
  checklist: 'Checklist',
}

function CardModalSidebarPanelHeader({
  styles,
  iconSize,
  iconStroke,
  panel,
  onBack,
}) {
  return (
    <div className={styles.cmSidebarHeader}>
      <div className={styles.cmSidebarHeaderLeading}>
        <button
          type="button"
          className={styles.cmSidebarHeaderBtn}
          aria-label="Voltar às opções"
          onClick={onBack}
        >
          <ChevronLeft size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
        </button>
        <p className={styles.cmSidebarTitle}>{SIDEBAR_PANEL_LABELS[panel]}</p>
      </div>
    </div>
  )
}

function CardModalSidebarGitHubPanel({ styles }) {
  return (
    <div className={styles.cmSidebarPanelBody}>
      <p className={styles.cmSidebarPanelEmpty}>
        Vincule repositórios e pull requests do GitHub a este cartão.
      </p>
    </div>
  )
}

function CardModalSidebarFilesPanel({
  styles,
  iconSize,
  iconStroke,
  attachments,
  openFilePicker,
  isMutating,
  attachmentUi,
  onDownloadFile,
}) {
  return (
    <CustomScrollArea
      className={styles.cmSidebarPanelScroll}
      viewportClassName={styles.cmSidebarPanelBody}
      enabled
      refreshKey={`sidebar-files:${attachments.length}`}
    >
      <button
        type="button"
        className={styles.cmSidebarPanelActionBtn}
        onClick={() => { void openFilePicker() }}
        disabled={isMutating}
      >
        <Paperclip size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
        Anexar arquivo
      </button>

      {attachments.length === 0 ? (
        <p className={styles.cmSidebarPanelEmpty}>Nenhum arquivo anexado ainda.</p>
      ) : (
        <CardModalInlineAttachments
          styles={styles}
          iconSize={iconSize}
          iconStroke={iconStroke}
          attachments={attachments}
          onDownloadFile={onDownloadFile}
          {...attachmentUi}
        />
      )}
    </CustomScrollArea>
  )
}

function CardModalSidebarChecklistPanel({
  styles,
  iconSize,
  iconSizeSm,
  iconStroke,
  isBackendDriven,
  activeChecklist,
  checklistReadOnly,
  checklistBlockUi,
  isChecklistMutating,
  handleChecklistCreate,
}) {
  if (!activeChecklist) {
    return (
      <div className={styles.cmSidebarPanelBody}>
        <p className={styles.cmSidebarPanelEmpty}>Nenhuma checklist neste cartão.</p>
        <button
          type="button"
          className={styles.cmSidebarPanelActionBtn}
          onClick={handleChecklistCreate}
          disabled={isChecklistMutating}
        >
          <Plus size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
          {isChecklistMutating ? 'Adicionando...' : 'Criar checklist'}
        </button>
      </div>
    )
  }

  return (
    <CustomScrollArea
      className={styles.cmSidebarPanelScroll}
      viewportClassName={styles.cmSidebarPanelBody}
      enabled
      refreshKey={`sidebar-checklist:${activeChecklist.items.length}`}
    >
      <CardModalChecklist
        styles={styles}
        iconSize={iconSize}
        iconSizeSm={iconSizeSm}
        iconStroke={iconStroke}
        isBackendDriven={isBackendDriven}
        activeChecklist={activeChecklist}
        checklistReadOnly={checklistReadOnly}
        {...checklistBlockUi}
      />
    </CustomScrollArea>
  )
}

function CardModalSidebarActivityPanel({
  styles,
  iconSize,
  iconStroke,
  isMutating,
  clearSidebarPanel,
  activityFeedRef,
  activityFeedItems,
  getCommentPresenter,
  expandedComments,
  setExpandedComments,
  overflowingComments,
  commentTextRefs,
  commentComposerRef,
  commentTextareaRef,
  comment,
  setComment,
  commentFocused,
  setCommentFocused,
  addComment,
  insertMenuButtonRef,
  showInsertMenu,
  setShowInsertMenu,
}) {
  return (
    <>
      <div className={styles.cmSidebarHeader}>
        <div className={styles.cmSidebarHeaderLeading}>
          <button
            type="button"
            className={styles.cmSidebarHeaderBtn}
            aria-label="Voltar às opções"
            onClick={clearSidebarPanel}
          >
            <ChevronLeft size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
          </button>
          <p className={styles.cmSidebarTitle}>Activity</p>
        </div>
        <div className={styles.cmSidebarHeaderActions}>
          <button type="button" className={styles.cmSidebarHeaderBtn} aria-label="Buscar atividade"><Search size={iconSize} strokeWidth={iconStroke} aria-hidden="true" /></button>
          <button type="button" className={styles.cmSidebarHeaderBtn} aria-label="Filtrar atividade"><Funnel size={14} strokeWidth={iconStroke} aria-hidden="true" /></button>
          <button type="button" className={styles.cmSidebarHeaderBtn} aria-label="Notificações">1</button>
        </div>
      </div>

      <div className={styles.cmSidebarContent}>
        <CustomScrollArea
          className={styles.cmActivityFeedScrollArea}
          viewportClassName={styles.cmActivityFeed}
          viewportRef={activityFeedRef}
          enabled
          refreshKey={`activity-feed:${activityFeedItems.length}`}
        >
          <div className={styles.cmActivitySpacer} aria-hidden="true" />
          <div className={styles.cmActivityTimeline}>
            {activityFeedItems.map((item) => {
              if (item.type === 'history') {
                return (
                  <p key={item.id} className={styles.cmHistoryItem}>
                    <strong>{item.actor}</strong> (você) {item.text}
                  </p>
                )
              }

              const c = item.comment
              const presenter = getCommentPresenter(c)
              const isExpanded = expandedComments[c.id]
              const isOverflowing = overflowingComments[c.id]
              return (
                <article key={c.id} className={styles.cmCommentCard}>
                  <header className={styles.cmCommentCardHeader}>
                    <AuthenticatedAvatar
                      className={styles.cmCommentAvatar}
                      imageClassName={styles.avatarImage}
                      style={{ background: presenter.color }}
                      avatarUrl={presenter.avatarUrl}
                      fallback={presenter.initials}
                      title={presenter.name}
                    />
                    <div className={styles.cmCommentCardMeta}>
                      <strong className={styles.cmCommentAuthor}>{presenter.name}</strong>
                      <span className={styles.cmCommentTime}>{c.time}</span>
                    </div>
                  </header>
                  <div className={styles.cmCommentCardBody}>
                    <p
                      ref={element => {
                        if (element) {
                          commentTextRefs.current[c.id] = element
                        } else {
                          delete commentTextRefs.current[c.id]
                        }
                      }}
                      className={`${styles.cmCommentCardText} ${!isExpanded ? styles.cmCommentCardTextClamped : ''}`}
                    >
                      {c.text}
                    </p>
                    {isOverflowing && (
                      <button
                        type="button"
                        className={styles.cmCommentCardToggle}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => {
                          e.stopPropagation()
                          setExpandedComments(prev => ({ ...prev, [c.id]: !prev[c.id] }))
                        }}
                      >
                        {isExpanded ? 'Ver menos' : 'Ver mais'}
                      </button>
                    )}
                  </div>
                  <footer className={styles.cmCommentCardFooter}>
                    <div className={styles.cmCommentCardActions}>
                      <button type="button" className={styles.cmCommentCardActionBtn} aria-label="Curtir comentário">
                        <ThumbsUp size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
                      </button>
                      <button type="button" className={styles.cmCommentCardActionBtn} aria-label="Adicionar reação">
                        <SmilePlus size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
                      </button>
                    </div>
                    <button type="button" className={styles.cmCommentReplyBtn}>
                      Responder
                    </button>
                  </footer>
                </article>
              )
            })}
          </div>
        </CustomScrollArea>

        <div className={styles.cmCommentDock}>
          <div ref={commentComposerRef} className={styles.cmCommentComposer}>
            <div
              className={`${styles.cmCommentComposerBox} ${commentFocused ? styles.cmCommentComposerBoxActive : ''}`}
            >
              <textarea
                ref={commentTextareaRef}
                className={styles.cmCommentTextarea}
                placeholder="Escreva um comentário..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                aria-label="Escrever comentário"
                onFocus={() => setCommentFocused(true)}
                onBlur={e => {
                  if (
                    !comment.trim() &&
                    !commentComposerRef.current?.contains(e.relatedTarget)
                  ) {
                    setCommentFocused(false)
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void addComment()
                  }
                }}
                disabled={isMutating}
              />

              <div className={styles.cmCommentComposerFooter}>
                <div className={styles.cmCommentComposerFooterLeft}>
                  <button
                    type="button"
                    className={styles.cmCommentAddBtn}
                    onMouseDown={e => e.preventDefault()}
                    aria-label="Adicionar bloco"
                  >
                    <Plus size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
                  </button>

                  <span className={styles.cmComposerDivider} aria-hidden="true" />

                  <button type="button" className={styles.cmCommentTypeBtn}>
                    Comentário
                    <ChevronRight size={11} strokeWidth={iconStroke} aria-hidden="true" />
                  </button>

                  <span className={styles.cmComposerDivider} aria-hidden="true" />

                  <button
                    ref={insertMenuButtonRef}
                    type="button"
                    className={styles.cmCommentToolIconBtn}
                    onMouseDown={e => e.preventDefault()}
                    aria-label="Aplicativos"
                    aria-expanded={showInsertMenu}
                    aria-haspopup="menu"
                    onClick={() => setShowInsertMenu(v => !v)}
                  >
                    <LayoutGrid size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
                  </button>
                  <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()} aria-label="Anexar ao comentário">
                    <Paperclip size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
                  </button>
                  <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()} aria-label="Mencionar">
                    <AtSign size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
                  </button>
                </div>

                <div className={styles.cmCommentComposerFooterRight}>
                  <button type="button" className={styles.cmCommentToolIconBtn} onMouseDown={e => e.preventDefault()} aria-label="Mais opções">
                    <Ellipsis size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.cmCommentSendBtn}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { void addComment() }}
                    disabled={!comment.trim() || isMutating}
                    aria-label="Enviar comentário"
                  >
                    <SendHorizontal size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function CardModalActivitySidebar({
  styles,
  iconSize,
  iconSizeSm,
  iconStroke,
  isActivitySidebarOpen,
  sidebarPanel,
  selectSidebarPanel,
  clearSidebarPanel,
  isMutating,
  toggleActivitySidebar,
  isBackendDriven,
  activeChecklist,
  checklistReadOnly,
  checklistBlockUi,
  isChecklistMutating,
  handleChecklistCreate,
  attachments,
  openFilePicker,
  attachmentUi,
  onDownloadFile,
  activityFeedRef,
  activityFeedItems,
  getCommentPresenter,
  expandedComments,
  setExpandedComments,
  overflowingComments,
  commentTextRefs,
  commentComposerRef,
  commentTextareaRef,
  comment,
  setComment,
  commentFocused,
  setCommentFocused,
  addComment,
  insertMenuButtonRef,
  showInsertMenu,
  setShowInsertMenu,
}) {
  return (
    <div className={`${styles.cmSidebarShell} ${!isActivitySidebarOpen ? styles.cmSidebarShellCollapsed : ''}`}>
      <button
        type="button"
        className={styles.cmSidebarToggleBtn}
        title={isActivitySidebarOpen ? 'Recolher painel lateral' : 'Expandir painel lateral'}
        aria-label={isActivitySidebarOpen ? 'Recolher painel lateral' : 'Expandir painel lateral'}
        aria-expanded={isActivitySidebarOpen}
        onClick={toggleActivitySidebar}
        disabled={isMutating}
      >
        {isActivitySidebarOpen ? (
          <ChevronsRight size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
        ) : (
          <ChevronsLeft size={iconSize} strokeWidth={iconStroke} aria-hidden="true" />
        )}
      </button>

      {isActivitySidebarOpen ? (
        <div className={styles.cmSidebar}>
          {!sidebarPanel ? (
            <CardModalSidebarPicker
              styles={styles}
              iconSize={iconSize}
              iconStroke={iconStroke}
              isMutating={isMutating}
              onSelectPanel={selectSidebarPanel}
            />
          ) : sidebarPanel === 'activity' ? (
            <CardModalSidebarActivityPanel
              styles={styles}
              iconSize={iconSize}
              iconStroke={iconStroke}
              isMutating={isMutating}
              clearSidebarPanel={clearSidebarPanel}
              activityFeedRef={activityFeedRef}
              activityFeedItems={activityFeedItems}
              getCommentPresenter={getCommentPresenter}
              expandedComments={expandedComments}
              setExpandedComments={setExpandedComments}
              overflowingComments={overflowingComments}
              commentTextRefs={commentTextRefs}
              commentComposerRef={commentComposerRef}
              commentTextareaRef={commentTextareaRef}
              comment={comment}
              setComment={setComment}
              commentFocused={commentFocused}
              setCommentFocused={setCommentFocused}
              addComment={addComment}
              insertMenuButtonRef={insertMenuButtonRef}
              showInsertMenu={showInsertMenu}
              setShowInsertMenu={setShowInsertMenu}
            />
          ) : (
            <>
              <CardModalSidebarPanelHeader
                styles={styles}
                iconSize={iconSize}
                iconStroke={iconStroke}
                panel={sidebarPanel}
                onBack={clearSidebarPanel}
              />

              {sidebarPanel === 'github' ? (
                <CardModalSidebarGitHubPanel styles={styles} />
              ) : null}

              {sidebarPanel === 'files' ? (
                <CardModalSidebarFilesPanel
                  styles={styles}
                  iconSize={iconSize}
                  iconStroke={iconStroke}
                  attachments={attachments}
                  openFilePicker={openFilePicker}
                  isMutating={isMutating}
                  attachmentUi={attachmentUi}
                  onDownloadFile={onDownloadFile}
                />
              ) : null}

              {sidebarPanel === 'checklist' ? (
                <CardModalSidebarChecklistPanel
                  styles={styles}
                  iconSize={iconSize}
                  iconSizeSm={iconSizeSm}
                  iconStroke={iconStroke}
                  isBackendDriven={isBackendDriven}
                  activeChecklist={activeChecklist}
                  checklistReadOnly={checklistReadOnly}
                  checklistBlockUi={checklistBlockUi}
                  isChecklistMutating={isChecklistMutating}
                  handleChecklistCreate={handleChecklistCreate}
                />
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
