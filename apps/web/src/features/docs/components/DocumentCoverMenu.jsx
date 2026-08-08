import { useEffect, useRef, useState } from 'react'
import { Monitor, Search, X } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { UnsplashLogo } from './docsEmbedExtension.jsx'
import { searchUnsplashPhotos } from '../utils/docsEmbedSearch.js'
import { uploadDocumentCoverFile } from '../utils/documentCover.js'

const ICON_STROKE = 1.6

export default function DocumentCoverMenu({
  open,
  onClose,
  onSelectCover,
  busy = false,
  styles,
}) {
  const { accessToken } = useAuth()
  const fileInputRef = useRef(null)
  const queryInputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setStatus('')
      setIsSearching(false)
      setIsUploading(false)
      return undefined
    }

    requestAnimationFrame(() => queryInputRef.current?.focus())

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const disabled = busy || isUploading || isSearching

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file?.type?.startsWith('image/') || disabled) return

    setIsUploading(true)
    setStatus('')
    try {
      const coverImageId = await uploadDocumentCoverFile(file, accessToken)
      await onSelectCover?.(coverImageId)
      onClose?.()
    } catch (error) {
      setStatus(error?.message ?? 'Não foi possível enviar a imagem.')
    } finally {
      setIsUploading(false)
    }
  }

  const searchUnsplash = async () => {
    const trimmed = query.trim()
    if (!trimmed || disabled) return

    setIsSearching(true)
    setStatus('')
    try {
      const data = await searchUnsplashPhotos({ query: trimmed, page: 1, token: accessToken })
      setResults(data?.results ?? [])
      if ((data?.results ?? []).length === 0) {
        setStatus('Nenhum resultado encontrado.')
      }
    } catch (error) {
      setResults([])
      setStatus(error?.message ?? 'Não foi possível buscar imagens.')
    } finally {
      setIsSearching(false)
    }
  }

  const selectUnsplash = async (url) => {
    if (!url || disabled) return
    await onSelectCover?.(url)
    onClose?.()
  }

  const clearCover = async () => {
    if (disabled) return
    await onSelectCover?.('')
    onClose?.()
  }

  return (
    <div className={styles.coverMenuPanel} role="dialog" aria-label="Escolher capa do documento">
      <div className={styles.coverMenuSection}>
        <button
          type="button"
          className={styles.coverMenuAction}
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <Monitor size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          <span>Do computador</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleUpload}
        />
      </div>

      <div className={styles.coverMenuSection}>
        <div className={styles.coverMenuSearchRow}>
          <span className={styles.coverMenuSearchBadge}>
            <UnsplashLogo size={14} aria-hidden="true" />
            <span>Unsplash</span>
          </span>
          <input
            ref={queryInputRef}
            type="text"
            className={styles.coverMenuSearchInput}
            value={query}
            placeholder="Buscar imagens..."
            disabled={disabled}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                searchUnsplash()
              }
            }}
          />
          <button
            type="button"
            className={styles.coverMenuSearchButton}
            aria-label="Buscar no Unsplash"
            disabled={disabled || !query.trim()}
            onClick={searchUnsplash}
          >
            <Search size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
        </div>

        {results.length > 0 ? (
          <div className={styles.coverMenuResults}>
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.coverMenuResult}
                disabled={disabled}
                aria-label={item.alt || 'Imagem do Unsplash'}
                onClick={() => selectUnsplash(item.fullUrl)}
              >
                {item.previewUrl ? (
                  <img className={styles.coverMenuResultImage} src={item.previewUrl} alt="" loading="lazy" />
                ) : (
                  <span className={styles.coverMenuResultFallback} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.coverMenuFooter}>
        <button type="button" className={styles.coverMenuClear} disabled={disabled} onClick={clearCover}>
          <X size={13} strokeWidth={ICON_STROKE} aria-hidden="true" />
          <span>Remover capa</span>
        </button>
        {status ? <p className={styles.coverMenuStatus}>{status}</p> : null}
        {isUploading ? <p className={styles.coverMenuStatus}>Enviando imagem...</p> : null}
      </div>
    </div>
  )
}
