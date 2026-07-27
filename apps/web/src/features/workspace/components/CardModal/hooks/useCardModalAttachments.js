import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  buildAttachedFileIds,
  computeFilePickerPosition,
  FILE_PICKER_FALLBACK_HEIGHT,
  filterPickerFiles,
  getActiveFileTypeLabel,
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

  const updateFilePickerPosition = () => {
    const rect = attachmentAddButtonRef.current?.getBoundingClientRect()
      ?? filePickerAnchorRef?.current?.getBoundingClientRect()
    const pickerHeight = filePickerRef.current?.getBoundingClientRect?.().height ?? FILE_PICKER_FALLBACK_HEIGHT
    const nextPosition = computeFilePickerPosition({ anchorRect: rect, pickerHeight })

    if (nextPosition) {
      setFilePickerPosition(nextPosition)
    }
  }

  const closeFilePicker = () => {
    setShowFilePickerTypeMenu(false)
    setFilePickerOpening(false)
    setShowFilePicker(false)
  }

  const openFilePicker = async (nextFilter = 'library') => {
    onCloseInsertMenu?.()
    setShowAttachmentAddMenu(false)
    setFilePickerFilter(nextFilter)
    setFilePickerTypeFilter('all')
    setShowFilePickerTypeMenu(false)
    setFileSearch('')
    updateFilePickerPosition()
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
      setShowFilePickerTypeMenu(false)
      setFilePickerOpening(false)
      setShowFilePicker(false)
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
      setShowFilePickerTypeMenu(false)
      setFilePickerOpening(false)
      setShowFilePicker(false)
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
      const clickedAttachmentControls = attachmentAddSplitRef.current?.contains(event.target)
      const clickedFilePicker = filePickerRef.current?.contains(event.target)

      if (!clickedAttachmentControls && !clickedFilePicker) {
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

  useEffect(() => {
    if (!showFilePicker) return

    updateFilePickerPosition()

    const handleViewportChange = () => {
      updateFilePickerPosition()
    }

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [showFilePicker])

  useLayoutEffect(() => {
    if (!showFilePicker) return
    updateFilePickerPosition()
  }, [showFilePicker, isFilePickerLoading, fileActionError, filesError, pickerFiles.length, filePickerFilter, filePickerTypeFilter])

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
