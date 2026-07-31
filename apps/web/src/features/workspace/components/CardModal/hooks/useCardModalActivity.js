import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createCardModalUid } from '../utils/cardModalCommon.js'
import {
  buildActivityFeedItems,
  buildActivitySidebarStorageKey,
  buildInitialActivitySnapshot,
  buildInitials,
  buildSidebarPanelStorageKey,
  formatCardCreatedLabel,
  isUserComment,
  readActivitySidebarOpenState,
  readSidebarPanelState,
  USER_COMMENT_KIND,
  writeSidebarPanelState,
} from '../utils/activityUtils.js'

export default function useCardModalActivity({
  card,
  currentUser,
  members,
  getMemberName,
  isInteractionBlocked,
  onAddComment,
  persistCardChangesRef,
  updateSaveStatus,
  setSubmitError,
  githubLinkedItems = [],
}) {
  const activitySidebarStorageKey = useMemo(
    () => buildActivitySidebarStorageKey(currentUser?.id),
    [currentUser?.id],
  )
  const sidebarPanelStorageKey = useMemo(
    () => buildSidebarPanelStorageKey(currentUser?.id),
    [currentUser?.id],
  )

  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(card.comments)
  const [activityBase, setActivityBase] = useState(() => buildInitialActivitySnapshot(card))
  const [activityEvents, setActivityEvents] = useState([])
  const [isActivitySidebarOpen, setIsActivitySidebarOpen] = useState(() => (
    readActivitySidebarOpenState(buildActivitySidebarStorageKey(currentUser?.id))
  ))
  const [sidebarPanel, setSidebarPanel] = useState(() => (
    readSidebarPanelState(buildSidebarPanelStorageKey(currentUser?.id))
  ))
  const [commentFocused, setCommentFocused] = useState(false)
  const [commentFollow, setCommentFollow] = useState(false)
  const [expandedComments, setExpandedComments] = useState({})
  const [overflowingComments, setOverflowingComments] = useState({})
  const [isSendingComment, setIsSendingComment] = useState(false)

  const commentComposerRef = useRef(null)
  const commentTextareaRef = useRef(null)
  const commentTextRefs = useRef({})
  const activityFeedRef = useRef(null)

  const currentUserName = currentUser?.fullName ?? currentUser?.email ?? 'Você'
  const createdAtLabel = formatCardCreatedLabel(activityBase.createdAt) ?? formatCardCreatedLabel(activityBase.created) ?? 'Recentemente'
  const visibleComments = useMemo(() => comments.filter(isUserComment), [comments])
  const activityFeedItems = useMemo(
    () => buildActivityFeedItems({
      activityBase,
      comments,
      activityEvents,
      currentUserName,
      createdAtLabel,
      members,
      getMemberName,
      githubLinkedItems,
    }),
    [activityBase, comments, activityEvents, currentUserName, createdAtLabel, members, getMemberName, githubLinkedItems],
  )

  useEffect(() => {
    setIsActivitySidebarOpen(readActivitySidebarOpenState(activitySidebarStorageKey))
  }, [activitySidebarStorageKey])

  useEffect(() => {
    setSidebarPanel(readSidebarPanelState(sidebarPanelStorageKey))
  }, [sidebarPanelStorageKey])

  useEffect(() => {
    setActivityBase(buildInitialActivitySnapshot(card))
    setActivityEvents([])
  }, [card.id])

  useLayoutEffect(() => {
    if (!commentTextareaRef.current) return

    const textarea = commentTextareaRef.current
    const minimumHeight = commentFocused ? 96 : 40

    textarea.style.height = 'auto'
    textarea.style.height = `${minimumHeight}px`

    const nextHeight = Math.min(textarea.scrollHeight, 160)
    textarea.style.height = `${Math.max(nextHeight, minimumHeight)}px`
  }, [comment, commentFocused])

  useLayoutEffect(() => {
    const nextOverflowingComments = {}

    visibleComments.forEach((commentItem) => {
      const element = commentTextRefs.current[commentItem.id]
      if (!element) return

      const computedStyle = window.getComputedStyle(element)
      const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 19.5
      const maxHeight = lineHeight * 10

      nextOverflowingComments[commentItem.id] = element.scrollHeight > maxHeight + 1
    })

    setOverflowingComments(nextOverflowingComments)
  }, [visibleComments])

  useLayoutEffect(() => {
    const feed = activityFeedRef.current
    if (!feed) return
    feed.scrollTop = feed.scrollHeight
  }, [activityFeedItems])

  const toggleActivitySidebar = () => {
    setIsActivitySidebarOpen((open) => {
      const next = !open
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(activitySidebarStorageKey, String(next))
        } catch {}
      }
      return next
    })
  }

  const selectSidebarPanel = (panel) => {
    setSidebarPanel(panel)
    writeSidebarPanelState(sidebarPanelStorageKey, panel)
  }

  const openSidebarPanel = (panel) => {
    setIsActivitySidebarOpen(true)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(activitySidebarStorageKey, 'true')
      } catch {}
    }
    selectSidebarPanel(panel)
  }

  const clearSidebarPanel = () => {
    setSidebarPanel(null)
    writeSidebarPanelState(sidebarPanelStorageKey, null)
  }

  const appendActivityEvent = (event) => {
    setActivityEvents((prev) => [...prev, event])
  }

  const getCommentPresenter = (commentItem) => {
    const memberId = commentItem.authorId ?? commentItem.author
    const member = memberId ? members.find((item) => item.id === memberId) : null

    if (member) {
      return {
        name: getMemberName(member),
        initials: member.initials ?? buildInitials(getMemberName(member)),
        color: member.color ?? 'var(--text-3)',
        avatarUrl: member.avatarUrl ?? null,
      }
    }

    const fallbackName = commentItem.authorName ?? commentItem.author ?? 'Você'

    return {
      name: fallbackName,
      initials: buildInitials(fallbackName),
      color: 'var(--text-3)',
      avatarUrl: commentItem.authorAvatarUrl ?? null,
    }
  }

  const addComment = async () => {
    const nextCommentText = comment.trim()
    if (!nextCommentText || isInteractionBlocked || isSendingComment) return

    setIsSendingComment(true)
    setSubmitError(null)
    updateSaveStatus('Salvando...')

    try {
      if (typeof onAddComment === 'function') {
        const createdComment = await onAddComment(card.id, nextCommentText)
        if (createdComment) {
          setComments((prev) => [...prev, createdComment])
        }
      } else {
        const createdComment = {
          id: createCardModalUid(),
          author: currentUser?.id ?? null,
          authorId: currentUser?.id ?? null,
          authorName: currentUserName,
          kind: USER_COMMENT_KIND,
          text: nextCommentText,
          time: 'Agora',
          createdAtIso: new Date().toISOString(),
        }
        setComments((prev) => [...prev, createdComment])
        const saved = await persistCardChangesRef.current(
          { comments: [...comments, createdComment] },
          {
            errorMessage: 'Não foi possível salvar o comentário.',
            successMessage: 'Comentário salvo.',
          },
        )

        if (!saved) {
          setComments((prev) => prev.filter((item) => item.id !== createdComment.id))
          return
        }
      }

      setComment('')
      setCommentFollow(false)
      setCommentFocused(false)
      updateSaveStatus('Comentário salvo.')
    } catch (error) {
      setSubmitError(error?.message ?? 'Não foi possível salvar o comentário.')
      updateSaveStatus('')
    } finally {
      setIsSendingComment(false)
    }
  }

  return {
    comment,
    setComment,
    comments,
    setComments,
    activityBase,
    activityEvents,
    isActivitySidebarOpen,
    sidebarPanel,
    sidebarPanelStorageKey,
    commentFocused,
    setCommentFocused,
    expandedComments,
    setExpandedComments,
    overflowingComments,
    isSendingComment,
    commentComposerRef,
    commentTextareaRef,
    commentTextRefs,
    activityFeedRef,
    activitySidebarStorageKey,
    createdAtLabel,
    visibleComments,
    activityFeedItems,
    toggleActivitySidebar,
    selectSidebarPanel,
    openSidebarPanel,
    clearSidebarPanel,
    appendActivityEvent,
    getCommentPresenter,
    addComment,
  }
}
