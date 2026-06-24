import {
  AtSign,
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

export default function CardModalActivitySidebar({
  styles,
  iconSize,
  iconStroke,
  isActivitySidebarOpen,
  isMutating,
  toggleActivitySidebar,
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
        title={isActivitySidebarOpen ? 'Recolher Activity' : 'Expandir Activity'}
        aria-label={isActivitySidebarOpen ? 'Recolher Activity' : 'Expandir Activity'}
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
          <div className={styles.cmSidebarHeader}>
            <p className={styles.cmSidebarTitle}>Activity</p>
            <div className={styles.cmSidebarHeaderActions}>
              <button type="button" className={styles.cmSidebarHeaderBtn} aria-label="Buscar atividade"><Search size={iconSize} strokeWidth={iconStroke} aria-hidden="true" /></button>
              <button type="button" className={styles.cmSidebarHeaderBtn} aria-label="Filtrar atividade"><Funnel size={14} strokeWidth={iconStroke} aria-hidden="true" /></button>
              <button type="button" className={styles.cmSidebarHeaderBtn} aria-label="Notificações">1</button>
            </div>
          </div>

          <div className={styles.cmSidebarContent}>
            <div ref={activityFeedRef} className={styles.cmActivityFeed}>
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
            </div>

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
        </div>
      ) : null}
    </div>
  )
}
