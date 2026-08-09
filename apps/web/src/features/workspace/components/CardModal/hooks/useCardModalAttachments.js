import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  buildAttachedFileIds,
  computeFilePickerPosition,
  filterPickerFiles,
  getActiveFileTypeLabel,
  getFilePickerFrameSize,
  resolveFilePickerAnchorElement,
} from '../utils/attachmentUtils.js'

export default function useCardModalAttachments({
  card,
  planFiles,
  libraryFiles,
  filesLoading,
  filesError,
  onLoadFiles,
  onAttachFile,
  onUploadLocalFile,
  onRemoveAttachment,
  onCloseInsertMenu,
  onSubmitError,
  filePickerAnchorRef,
}) {
  const [attachments, setAttachments] = useState(Array.isArray(card.attachments) ? card.attachments : [])
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [showAttachmentAddMenu, setShowAttachmentAddMenu] = useState(false)
  const [filePickerOpening, setFilePickerOpening] = useState(false)
  const [filePickerFilter, setFilePickerFilter] = useState('plan')
  const [filePickerTypeFilter, setFilePickerTypeFilter] = useState('all')
  const [showFilePickerTypeMenu, setShowFilePickerTypeMenu] = useState(false)
  const [filePickerPosition, setFilePickerPosition] = useState({ top: 0, left: 0 })
  const [fileSearch, setFileSearch] = useState('')
  const [fileActionError, setFileActionError] = useState('')
  const [attachingFileId, setAttachingFileId] = useState(null)
  const [uploadingLocalFile, setUploadingLocalFile] = useState(false)
  const [removingAttachmentId, setRemovingAttachmentId] = useState(null)

  const attachmentAddMenuRef = useRef(null)
  const attachmentAddButtonRef = useRef(null)
  const attachmentAddSplitRef = useRef(null)
  const activeFilePickerAnchorRef = useRef(null)
  const filePickerPositionLockedRef = useRef(false)
  const filePickerRef = useRef(null)
  const filePickerTypeButtonRef = useRef(null)
  const filePickerTypeMenuRef = useRef(null)
  const localFileInputRef = useRef(null)

  const pickerSourceFiles = filePickerFilter === 'plan' ? planFiles : libraryFiles
  const pickerFiles = useMemo(
    () => filterPickerFiles(pickerSourceFiles, fileSearch, filePickerTypeFilter),
    [pickerSourceFiles, fileSearch, filePickerTypeFilter],
  )
  const isFilePickerLoading = filePickerOpening || filesLoading
  const attachedFileIds = useMemo(() => buildAttachedFileIds(attachments), [attachments])
  const activeFileTypeLabel = getActiveFileTypeLabel(filePickerTypeFilter)

  const resolveActiveAnchorElement = (explicitAnchor) => (
    resolveFilePickerAnchorElement(explicitAnchor)
      ?? attachmentAddButtonRef.current
      ?? resolveFilePickerAnchorElement(filePickerAnchorRef)
      ?? null
  )

  const lockFilePickerPosition = () => {
    if (filePickerPositionLockedRef.current) return

    const anchorEl = activeFilePickerAnchorRef.current ?? resolveActiveAnchorElement()
    const rect = anchorEl?.getBoundingClientRect?.()
    if (!rect) return

    // Always use the fixed CSS frame size — never the live content height — so tab
    // switches (Plano ↔ Biblioteca) cannot move the picker.
    const frame = getFilePickerFrameSize()
    const nextPosition = computeFilePickerPosition({
      anchorRect: rect,
      pickerHeight: frame.height,
      pickerWidth: frame.width,
    })

    if (nextPosition) {
      setFilePickerPosition(nextPosition)
      filePickerPositionLockedRef.current = true
    }
  }

  const closeFilePicker = () => {
    setShowFilePickerTypeMenu(false)
    setFilePickerOpening(false)
    setShowFilePicker(false)
    activeFilePickerAnchorRef.current = null
    filePickerPositionLockedRef.current = false
  }

  const openFilePicker = async (filterOrOptions = 'library', maybeAnchor = null) => {
    const options = typeof filterOrOptions === 'string'
      ? { filter: filterOrOptions, anchor: maybeAnchor }
      : (filterOrOptions ?? {})
    const nextFilter = options.filter ?? 'library'
    const explicitAnchor = options.anchor ?? null
    const anchorEl = resolveActiveAnchorElement(explicitAnchor)

    onCloseInsertMenu?.()
    setShowAttachmentAddMenu(false)
    setFilePickerFilter(nextFilter)
    setFilePickerTypeFilter('all')
    setShowFilePickerTypeMenu(false)
    setFileSearch('')
    activeFilePickerAnchorRef.current = anchorEl
    filePickerPositionLockedRef.current = false
    setFilePickerOpening(true)
    setShowFilePicker(true)
    setFileActionError('')

    try {
      await onLoadFiles?.()
    } finally {
      setFilePickerOpening(false)
    }
  }

  const handleAttachFile = async (file) => {
    if (!onAttachFile || attachingFileId || attachedFileIds.has(file.id)) return

    setAttachingFileId(file.id)
    setFileActionError('')

    try {
      const nextCard = await onAttachFile(file, card.id)
      if (nextCard?.attachments) {
        setAttachments(nextCard.attachments)
      }
      closeFilePicker()
      setFileSearch('')
    } catch (error) {
      setFileActionError(error?.message ?? 'Não foi possível anexar este arquivo.')
    } finally {
      setAttachingFileId(null)
    }
  }

  const handleRemoveAttachment = async (attachment) => {
    if (!onRemoveAttachment || removingAttachmentId || !attachment.canRemove) return

    setRemovingAttachmentId(attachment.id)
    onSubmitError?.(null)

    try {
      const nextCard = await onRemoveAttachment(attachment)
      if (nextCard?.attachments) {
        setAttachments(nextCard.attachments)
      } else {
        setAttachments((current) => current.filter((item) => item.id !== attachment.id))
      }
    } catch (error) {
      onSubmitError?.(error?.message ?? 'Não foi possível remover o anexo.')
    } finally {
      setRemovingAttachmentId(null)
    }
  }

  const handleLocalFileInput = async (event) => {
    const [localFile] = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (!localFile || !onUploadLocalFile || uploadingLocalFile) return

    setShowAttachmentAddMenu(false)
    setShowFilePickerTypeMenu(false)
    setUploadingLocalFile(true)
    setFileActionError('')
    onSubmitError?.(null)

    try {
      const nextCard = await onUploadLocalFile(localFile, card.id)
      if (nextCard?.attachments) {
        setAttachments(nextCard.attachments)
      }
      closeFilePicker()
      setFileSearch('')
    } catch (error) {
      const message = error?.message ?? 'Não foi possível enviar e anexar este arquivo.'
      setFileActionError(message)
      onSubmitError?.(message)
    } finally {
      setUploadingLocalFile(false)
    }
  }

  const handleDownloadError = (error) => {
    setFileActionError(error?.message ?? 'Não foi possível baixar este arquivo.')
  }

  const handleAttachmentDownloadError = (error) => {
    onSubmitError?.(error?.message ?? 'Não foi possível baixar o anexo.')
  }

  useEffect(() => {
    setAttachments(Array.isArray(card.attachments) ? card.attachments : [])
  }, [card.id, card.attachments])

  useEffect(() => {
    if (!showAttachmentAddMenu && !showFilePicker) return

    const handlePointerDown = (event) => {
      const target = event.target
      const clickedAttachmentControls = attachmentAddSplitRef.current?.contains(target)
      const clickedFilePicker = filePickerRef.current?.contains(target)
      const clickedActiveAnchor = activeFilePickerAnchorRef.current?.contains?.(target)
        ?? attachmentAddButtonRef.current?.contains?.(target)

      if (!clickedAttachmentControls && !clickedFilePicker && !clickedActiveAnchor) {
        setShowAttachmentAddMenu(false)
        closeFilePicker()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowAttachmentAddMenu(false)
        closeFilePicker()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showAttachmentAddMenu, showFilePicker])

  // Lock top/left once when the picker opens. Do not re-run on content/filter/size changes.
  useLayoutEffect(() => {
    if (!showFilePicker) {
      filePickerPositionLockedRef.current = false
      return
    }

    lockFilePickerPosition()
  }, [showFilePicker])

  useEffect(() => {
    if (!showFilePickerTypeMenu) return

    const handlePointerDown = (event) => {
      const clickedButton = filePickerTypeButtonRef.current?.contains(event.target)
      const clickedMenu = filePickerTypeMenuRef.current?.contains(event.target)

      if (!clickedButton && !clickedMenu) {
        setShowFilePickerTypeMenu(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowFilePickerTypeMenu(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showFilePickerTypeMenu])

  return {
    attachments,
    setAttachments,
    openFilePicker,
    closeFilePicker,
    attachmentAddMenuRef,
    attachmentAddButtonRef,
    attachmentAddSplitRef,
    filePickerRef,
    filePickerTypeButtonRef,
    filePickerTypeMenuRef,
    localFileInputRef,
    showFilePicker,
    showAttachmentAddMenu,
    setShowAttachmentAddMenu,
    setFilePickerOpening,
    setShowFilePicker,
    filePickerFilter,
    setFilePickerFilter,
    filePickerTypeFilter,
    setFilePickerTypeFilter,
    showFilePickerTypeMenu,
    setShowFilePickerTypeMenu,
    filePickerPosition,
    fileSearch,
    setFileSearch,
    fileActionError,
    attachingFileId,
    uploadingLocalFile,
    removingAttachmentId,
    planFiles,
    libraryFiles,
    filesError,
    pickerFiles,
    isFilePickerLoading,
    attachedFileIds,
    activeFileTypeLabel,
    handleAttachFile,
    handleRemoveAttachment,
    handleLocalFileInput,
    handleDownloadError,
    handleAttachmentDownloadError,
  }
}
