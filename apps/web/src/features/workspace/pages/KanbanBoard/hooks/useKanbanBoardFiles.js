import { useCallback, useState } from 'react'
import { apiRequest, triggerBlobDownload } from '../../../../../shared/api/apiClient.js'
import {
  appendAttachmentToColumns,
  removeAttachmentFromColumns,
} from '../utils/kanbanBoardColumnUtils.js'
import {
  mapApiAttachmentItem,
  mapApiFileItem,
  mapAttachmentToFileItem,
  upsertFileItem,
} from '../utils/kanbanBoardFileUtils.js'

export function useKanbanBoardFiles({
  activePlanId,
  isBackendDriven,
  accessToken,
  columns,
  updateColumns,
  activeCard,
  setActiveCard,
  showNotification,
}) {
  const [planFiles, setPlanFiles] = useState([])
  const [libraryFiles, setLibraryFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState(null)

  const refreshActiveCardFromColumns = useCallback((nextColumns, cardId) => {
    for (const column of nextColumns) {
      const nextCard = column.cards.find((card) => card.id === cardId)
      if (nextCard) {
        setActiveCard((current) => (
          current?.card?.id === cardId
            ? { ...current, card: nextCard, colTitle: column.title }
            : current
        ))
        return nextCard
      }
    }
    return null
  }, [setActiveCard])

  const reloadFileLists = useCallback(async () => {
    if (!activePlanId || !isBackendDriven) {
      setPlanFiles([])
      setLibraryFiles([])
      setFilesError(null)
      return { plan: [], library: [] }
    }

    setFilesLoading(true)
    setFilesError(null)

    try {
      const [planItems, libraryItems] = await Promise.all([
        apiRequest(`/api/files/plans/${activePlanId}`, {
          token: accessToken,
        }),
        apiRequest('/api/files', {
          token: accessToken,
        }),
      ])
      const nextPlanFiles = planItems.map(mapApiFileItem).filter((file) => file.type !== 'folder')
      const nextLibraryFiles = libraryItems.map(mapApiFileItem).filter((file) => file.type !== 'folder')
      setPlanFiles(nextPlanFiles)
      setLibraryFiles(nextLibraryFiles)
      return { plan: nextPlanFiles, library: nextLibraryFiles }
    } catch (error) {
      const message = error?.message ?? 'Não foi possível carregar os arquivos.'
      setFilesError(message)
      showNotification(message)
      return { plan: [], library: [] }
    } finally {
      setFilesLoading(false)
    }
  }, [accessToken, activePlanId, isBackendDriven, showNotification])

  const attachFileToCard = useCallback(async (file, cardId) => {
    if (!activePlanId || !isBackendDriven) return null

    const createdAttachment = mapApiAttachmentItem(await apiRequest(`/api/files/${file.id}/attach/cards/${cardId}`, {
      method: 'POST',
      token: accessToken,
    }))
    let nextColumns = columns
    updateColumns((prev) => {
      nextColumns = appendAttachmentToColumns(prev, cardId, createdAttachment)
      return nextColumns
    })
    setPlanFiles((current) => upsertFileItem(current, {
      ...file,
      sharedByCurrentUser: true,
      canUnshare: true,
    }))
    setLibraryFiles((current) => upsertFileItem(current, {
      ...file,
      sharedByCurrentUser: true,
      canUnshare: true,
    }))
    showNotification(`"${file.name}" anexado ao cartão.`)
    return refreshActiveCardFromColumns(nextColumns, cardId)
  }, [accessToken, activePlanId, columns, isBackendDriven, refreshActiveCardFromColumns, showNotification, updateColumns])

  const uploadLocalFileToCard = useCallback(async (localFile, cardId) => {
    if (!activePlanId || !isBackendDriven || !(localFile instanceof File)) return null

    const formData = new FormData()
    formData.append('file', localFile)

    const createdAttachment = mapApiAttachmentItem(await apiRequest(`/api/files/upload/attach/cards/${cardId}`, {
      method: 'POST',
      token: accessToken,
      body: formData,
    }))
    const createdFile = mapAttachmentToFileItem(createdAttachment)
    let nextColumns = columns
    updateColumns((prev) => {
      nextColumns = appendAttachmentToColumns(prev, cardId, createdAttachment)
      return nextColumns
    })
    setPlanFiles((current) => upsertFileItem(current, createdFile))
    setLibraryFiles((current) => upsertFileItem(current, createdFile))
    showNotification(`"${localFile.name}" enviado para a Biblioteca e anexado ao cartão.`)
    return refreshActiveCardFromColumns(nextColumns, cardId)
  }, [accessToken, activePlanId, columns, isBackendDriven, refreshActiveCardFromColumns, showNotification, updateColumns])

  const removeAttachmentFromCard = useCallback(async (attachment) => {
    if (!activePlanId || !isBackendDriven) return null

    await apiRequest(`/api/files/attachments/${attachment.id}`, {
      method: 'DELETE',
      token: accessToken,
    })
    let nextColumns = columns
    updateColumns((prev) => {
      nextColumns = removeAttachmentFromColumns(prev, attachment.id)
      return nextColumns
    })
    showNotification(`"${attachment.name}" removido do cartão.`)
    return refreshActiveCardFromColumns(nextColumns, activeCard?.card?.id)
  }, [accessToken, activeCard?.card?.id, activePlanId, columns, isBackendDriven, refreshActiveCardFromColumns, showNotification, updateColumns])

  const downloadFile = useCallback(async (file) => {
    if (!isBackendDriven) {
      showNotification(`Baixando "${file.name}"...`)
      return
    }

    const blob = await apiRequest(`/api/files/${file.fileId ?? file.id}/download`, {
      token: accessToken,
      responseType: 'blob',
    })
    triggerBlobDownload(blob, file.name)
    showNotification(`"${file.name}" baixado.`)
  }, [accessToken, isBackendDriven, showNotification])

  return {
    planFiles,
    libraryFiles,
    filesLoading,
    filesError,
    reloadFileLists,
    attachFileToCard,
    uploadLocalFileToCard,
    removeAttachmentFromCard,
    downloadFile,
  }
}
