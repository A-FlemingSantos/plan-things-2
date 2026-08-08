import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { apiRequest } from '../../../shared/api/apiClient.js'

const DocsContext = createContext(null)

function isConflict(error) {
  return error?.status === 409 || error?.code === 'VERSAO_DESATUALIZADA'
}

export function DocsProvider({ children }) {
  const { accessToken } = useAuth()
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshDocuments = useCallback(async () => {
    if (!accessToken) {
      setDocuments([])
      setIsLoading(false)
      return []
    }

    setIsLoading(true)
    try {
      const nextDocuments = await apiRequest('/api/documents', { token: accessToken })
      setDocuments(nextDocuments)
      setError(null)
      return nextDocuments
    } catch (nextError) {
      setError(nextError)
      throw nextError
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    refreshDocuments().catch(() => {})
  }, [refreshDocuments])

  const loadDocument = useCallback(async (documentId) => {
    if (!documentId) return null
    const document = await apiRequest(`/api/documents/${documentId}`, { token: accessToken })
    return document
  }, [accessToken])

  const createDocument = useCallback(async (values = {}) => {
    const document = await apiRequest('/api/documents', {
      method: 'POST',
      token: accessToken,
      body: {
        title: values.title ?? '',
        description: values.description ?? '',
        contentMarkdown: values.contentMarkdown ?? '',
      },
    })
    setDocuments((current) => [document.document, ...current])
    return document
  }, [accessToken])

  const saveDocument = useCallback(async (documentId, values) => {
    try {
      const document = await apiRequest(`/api/documents/${documentId}`, {
        method: 'PATCH',
        token: accessToken,
        body: values,
      })
      setDocuments((current) => current.map((item) => (
        item.id === documentId ? document.document : item
      )))
      return document
    } catch (saveError) {
      if (isConflict(saveError)) {
        const currentDocument = await loadDocument(documentId)
        saveError.currentDocument = currentDocument
      }
      throw saveError
    }
  }, [accessToken, loadDocument])

  const deleteDocument = useCallback(async (documentId) => {
    await apiRequest(`/api/documents/${documentId}`, {
      method: 'DELETE',
      token: accessToken,
    })
    setDocuments((current) => current.filter((document) => document.id !== documentId))
  }, [accessToken])

  const duplicateDocument = useCallback(async (documentId) => {
    const document = await apiRequest(`/api/documents/${documentId}/duplicate`, {
      method: 'POST',
      token: accessToken,
    })
    setDocuments((current) => [document.document, ...current])
    return document
  }, [accessToken])

  const value = useMemo(() => ({
    documents,
    isLoading,
    error,
    refreshDocuments,
    loadDocument,
    createDocument,
    saveDocument,
    deleteDocument,
    duplicateDocument,
  }), [
    createDocument,
    deleteDocument,
    documents,
    duplicateDocument,
    error,
    isLoading,
    loadDocument,
    refreshDocuments,
    saveDocument,
  ])

  return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>
}

export function useDocs() {
  const context = useContext(DocsContext)
  if (!context) {
    throw new Error('useDocs must be used within DocsProvider.')
  }
  return context
}
