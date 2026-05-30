import { useEffect } from 'react'

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function buildStreamUrl(path) {
  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin
  return new URL(`${DEFAULT_API_BASE_URL}${path}`, origin).toString()
}

function parseSseChunk(chunk = '') {
  const lines = String(chunk)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())

  let eventName = 'message'
  const dataLines = []

  lines.forEach((line) => {
    if (!line) return
    if (line.startsWith(':')) return
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim() || 'message'
      return
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart())
    }
  })

  const rawData = dataLines.join('\n')
  if (!rawData) return null

  try {
    return {
      event: eventName,
      data: JSON.parse(rawData),
    }
  } catch {
    return {
      event: eventName,
      data: rawData,
    }
  }
}

export function useAiStream({
  conversationId = null,
  accessToken = null,
  enabled = true,
  onEvent = () => {},
  onError = () => {},
} = {}) {
  useEffect(() => {
    if (!enabled || !conversationId || !accessToken || typeof window === 'undefined') {
      return undefined
    }

    const controller = new AbortController()

    const consumeStream = async () => {
      try {
        const response = await fetch(
          buildStreamUrl(`/api/intelligence/conversations/${conversationId}/stream`),
          {
            method: 'GET',
            headers: {
              Accept: 'text/event-stream',
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          },
        )

        if (!response.ok || !response.body) {
          throw new Error('Nao foi possivel abrir o stream da conversa.')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (!controller.signal.aborted) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const events = buffer.split(/\r?\n\r?\n/)
          buffer = events.pop() ?? ''

          events.forEach((eventChunk) => {
            const parsed = parseSseChunk(eventChunk)
            if (parsed) {
              onEvent(parsed)
            }
          })
        }
      } catch (error) {
        if (controller.signal.aborted) return
        onError(error)
      }
    }

    consumeStream()

    return () => {
      controller.abort()
    }
  }, [accessToken, conversationId, enabled, onError, onEvent])
}
