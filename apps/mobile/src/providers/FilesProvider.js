import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { mapApiFileItem } from '@plan-things/shared-client/files'
import { mobileApiRequest } from '../services/api'
import { useAuth } from './AuthProvider'

const FilesContext = createContext(null)

export function FilesProvider({ children }) {
  const { accessToken } = useAuth()
  const [files, setFiles] = useState([])

  const request = useCallback((path, options = {}) => mobileApiRequest(path, {
    ...options,
    token: accessToken,
  }), [accessToken])

  const loadFiles = useCallback(async () => {
    if (!accessToken) return
    const [active, trash] = await Promise.all([
      request('/api/files'),
      request('/api/files', { query: { trash: true } }),
    ])
    setFiles([...(active ?? []), ...(trash ?? [])].map(mapApiFileItem))
  }, [accessToken, request])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const createFolder = useCallback(async (name, parentId) => {
    await request('/api/files/folders', {
      method: 'POST',
      query: { name, parentId },
    })
    await loadFiles()
  }, [loadFiles, request])

  const uploadFile = useCallback(async (file, parentId) => {
    const formData = new FormData()
    formData.append('file', file)
    await request('/api/files/upload', {
      method: 'POST',
      query: { parentId },
      body: formData,
    })
    await loadFiles()
  }, [loadFiles, request])

  const downloadFile = useCallback((fileId) => request(`/api/files/${fileId}/download`, {
    responseType: 'blob',
  }), [request])

  const toggleFavorite = useCallback(async (file) => {
    await request(`/api/files/${file.id}/${file.favorite ? 'unfavorite' : 'favorite'}`, { method: 'POST' })
    await loadFiles()
  }, [loadFiles, request])

  const trashFile = useCallback(async (fileId) => {
    await request(`/api/files/${fileId}`, { method: 'DELETE' })
    await loadFiles()
  }, [loadFiles, request])

  const restoreFile = useCallback(async (fileId) => {
    await request(`/api/files/${fileId}/restore`, { method: 'POST' })
    await loadFiles()
  }, [loadFiles, request])

  const shareToPlan = useCallback(async (fileId, planId) => {
    if (!planId) return
    await request(`/api/files/${fileId}/share/plans/${planId}`, { method: 'POST' })
    await loadFiles()
  }, [loadFiles, request])

  const unshareFromPlan = useCallback(async (fileId, planId) => {
    if (!planId) return
    await request(`/api/files/${fileId}/share/plans/${planId}`, { method: 'DELETE' })
    await loadFiles()
  }, [loadFiles, request])

  const value = useMemo(() => ({
    files,
    loadFiles,
    createFolder,
    uploadFile,
    downloadFile,
    toggleFavorite,
    trashFile,
    restoreFile,
    shareToPlan,
    unshareFromPlan,
  }), [createFolder, downloadFile, files, loadFiles, restoreFile, shareToPlan, toggleFavorite, trashFile, unshareFromPlan, uploadFile])

  return <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
}

export function useFiles() {
  const context = useContext(FilesContext)
  if (!context) {
    throw new Error('useFiles must be used within FilesProvider')
  }
  return context
}
