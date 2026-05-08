import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { mapApiFileItem } from '@plan-things/shared-client/files'
import { mobileApiRequest, mobileApiUrl } from '../services/api'
import { useAuth } from './AuthProvider'

const FilesContext = createContext(null)

function sanitizeFilename(name = 'arquivo') {
  return String(name).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'arquivo'
}

function triggerWebDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

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

  const loadPlanFiles = useCallback(async (planId) => {
    if (!accessToken || !planId) return []
    const items = await request(`/api/files/plans/${planId}`)
    return (items ?? []).map(mapApiFileItem)
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

  const downloadFile = useCallback(async (file) => {
    const fileId = typeof file === 'string' ? file : file?.id
    const filename = sanitizeFilename(typeof file === 'string' ? 'arquivo' : file?.name)
    if (!fileId) return null

    if (Platform.OS === 'web') {
      const blob = await request(`/api/files/${fileId}/download`, {
        responseType: 'blob',
      })
      triggerWebDownload(blob, filename)
      return null
    }

    const destination = `${FileSystem.documentDirectory}${filename}`
    const result = await FileSystem.downloadAsync(
      mobileApiUrl(`/api/files/${fileId}/download`),
      destination,
      {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    )
    if (result.status >= 400) {
      throw new Error('Nao foi possivel baixar o arquivo.')
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri)
    }
    return result.uri
  }, [accessToken, request])

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
    loadPlanFiles,
    createFolder,
    uploadFile,
    downloadFile,
    toggleFavorite,
    trashFile,
    restoreFile,
    shareToPlan,
    unshareFromPlan,
  }), [createFolder, downloadFile, files, loadFiles, loadPlanFiles, restoreFile, shareToPlan, toggleFavorite, trashFile, unshareFromPlan, uploadFile])

  return <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
}

export function useFiles() {
  const context = useContext(FilesContext)
  if (!context) {
    throw new Error('useFiles must be used within FilesProvider')
  }
  return context
}
