import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { formatEmbedResultCount } from '../utils/docsEmbedMarkdown.js'
import { searchUnsplashPhotos, searchYouTubeVideos } from '../utils/docsEmbedSearch.js'
import { chunkResults, layoutEmbedRow } from '../utils/embedSearchLayout.js'

export default function DocsEmbedResults({
  kind,
  query,
  page = 1,
  pageToken = '',
  styles,
  interactive = false,
  onSelect,
  onNextPage,
}) {
  const { accessToken } = useAuth()
  const [state, setState] = useState({ status: 'idle', data: null, error: '' })
  const [dimensions, setDimensions] = useState({})

  useEffect(() => {
    setDimensions({})
  }, [kind, page, pageToken, query])

  useEffect(() => {
    if (!query?.trim()) {
      setState({ status: 'idle', data: null, error: '' })
      return undefined
    }

    let cancelled = false
    setState((current) => ({ ...current, status: 'loading', error: '' }))

    const load = async () => {
      try {
        const data = kind === 'video'
          ? await searchYouTubeVideos({ query: query.trim(), pageToken, token: accessToken })
          : await searchUnsplashPhotos({ query: query.trim(), page, token: accessToken })

        if (!cancelled) {
          setState({ status: 'ready', data, error: '' })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error?.message ?? 'Não foi possível carregar os resultados.',
          })
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [accessToken, kind, page, pageToken, query])

  const handleImageLoad = useCallback((itemId, event) => {
    const image = event.currentTarget
    const width = image.naturalWidth
    const height = image.naturalHeight
    if (!width || !height) return

    setDimensions((current) => {
      const existing = current[itemId]
      if (existing?.width === width && existing?.height === height) {
        return current
      }
      return { ...current, [itemId]: { width, height } }
    })
  }, [])

  if (!query?.trim()) return null

  if (state.status === 'loading' && !state.data) {
    return <p className={styles.embedSearchStatus}>Buscando...</p>
  }

  if (state.status === 'error') {
    return <p className={styles.embedSearchStatusError}>{state.error}</p>
  }

  const results = state.data?.results ?? []
  const total = kind === 'video' ? state.data?.total ?? 0 : state.data?.total ?? 0
  const hasNext = kind === 'video'
    ? Boolean(state.data?.nextPageToken)
    : results.length === 9 && (page * 9) < total

  return (
    <div className={styles.embedSearchResults}>
      {results.length === 0 ? (
        <p className={styles.embedSearchStatus}>Nenhum resultado encontrado.</p>
      ) : (
        <>
          <div className={styles.embedSearchGrid}>
            {chunkResults(results).map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className={styles.embedSearchRow}>
                {layoutEmbedRow(row, kind, dimensions).map(({ item, width }, columnIndex) => {
                  const previewUrl = kind === 'video' ? item.thumbnailUrl : item.previewUrl
                  const label = kind === 'video' ? item.title : (item.alt || 'Imagem do Unsplash')
                  const selectedUrl = kind === 'video' ? item.watchUrl : item.fullUrl
                  const tileIndex = rowIndex * 3 + columnIndex

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.embedSearchTile}
                      style={{
                        width,
                        flex: `0 0 ${width}`,
                        '--embed-tile-delay': `${tileIndex * 45}ms`,
                      }}
                      disabled={!interactive}
                      aria-label={label}
                      onClick={() => interactive && onSelect?.(selectedUrl)}
                    >
                      {previewUrl ? (
                        <img
                          className={styles.embedSearchTileImage}
                          src={previewUrl}
                          alt=""
                          loading="lazy"
                          draggable={false}
                          onLoad={(event) => handleImageLoad(item.id, event)}
                        />
                      ) : (
                        <span className={styles.embedSearchTileFallback} aria-hidden="true" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          <div className={styles.embedSearchFooter}>
            <span className={styles.embedSearchCount}>{formatEmbedResultCount(total)}</span>
            {hasNext ? (
              <button
                type="button"
                className={styles.embedSearchNext}
                onClick={() => {
                  if (kind === 'video') {
                    onNextPage?.(state.data?.nextPageToken ?? '')
                    return
                  }
                  onNextPage?.()
                }}
              >
                Mais
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
