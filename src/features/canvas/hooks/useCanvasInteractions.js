import { useCallback, useEffect, useRef, useState } from 'react'

const uid = () => Math.random().toString(36).slice(2, 9)

export function useCanvasInteractions({
  activePlanId,
  cards,
  connections,
  pan,
  zoom,
  setCards,
  setConnections,
  setPan,
  setZoom,
  tools,
  canvasGridClassName,
  cardWidth,
  minZoom,
  maxZoom,
}) {
  const [toolbarOpen, setToolbarOpen] = useState(true)
  const [tool, setTool] = useState('select')
  const [selected, setSelected] = useState(null)
  const [connectFrom, setConnectFrom] = useState(null)
  const [svgMouse, setSvgMouse] = useState(null)

  const canvasRef = useRef(null)
  const isPanning = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const draggingCard = useRef(null)
  const didMove = useRef(false)
  const cardHeights = useRef({})

  useEffect(() => {
    setSelected(null)
    setConnectFrom(null)
    setSvgMouse(null)
  }, [activePlanId])

  const switchTool = useCallback((nextTool) => {
    setTool(nextTool)

    if (nextTool !== 'connect') {
      setConnectFrom(null)
      setSvgMouse(null)
    }
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return

      const shortcutTool = tools.find((candidate) => candidate.key === event.key.toLowerCase())

      if (shortcutTool) {
        switchTool(shortcutTool.id)
      }

      if (event.key === 'Escape') {
        setSelected(null)
        setConnectFrom(null)
        setSvgMouse(null)
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selected && tool === 'select') {
        setCards((prev) => prev.filter((card) => card.id !== selected))
        setConnections((prev) => prev.filter((connection) => connection.from !== selected && connection.to !== selected))
        setSelected(null)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, setCards, setConnections, switchTool, tool, tools])

  const handleCanvasPointerDown = useCallback((event) => {
    if (event.target !== canvasRef.current && !event.target.classList.contains(canvasGridClassName)) return

    didMove.current = false
    lastMouse.current = { x: event.clientX, y: event.clientY }

    if (tool === 'pan' || tool === 'select') {
      isPanning.current = true
      setSelected(null)
      canvasRef.current.setPointerCapture(event.pointerId)
    }
  }, [canvasGridClassName, tool])

  const handlePointerMove = useCallback((event) => {
    const dx = event.clientX - lastMouse.current.x
    const dy = event.clientY - lastMouse.current.y

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      didMove.current = true
    }

    if (connectFrom && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      setSvgMouse({ x: event.clientX - rect.left, y: event.clientY - rect.top })
    }

    if (draggingCard.current) {
      const { cardId, startMX, startMY, startCX, startCY } = draggingCard.current
      const cdx = (event.clientX - startMX) / zoom
      const cdy = (event.clientY - startMY) / zoom

      setCards((prev) => prev.map((card) => (
        card.id === cardId ? { ...card, x: startCX + cdx, y: startCY + cdy } : card
      )))
      return
    }

    if (isPanning.current) {
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
      lastMouse.current = { x: event.clientX, y: event.clientY }
    }
  }, [connectFrom, setCards, setPan, zoom])

  const handlePointerUp = useCallback((event) => {
    draggingCard.current = null
    isPanning.current = false

    if (!didMove.current && tool === 'card') {
      const rect = canvasRef.current.getBoundingClientRect()
      const cx = (event.clientX - rect.left - pan.x) / zoom
      const cy = (event.clientY - rect.top - pan.y) / zoom
      const newCard = {
        id: uid(),
        x: cx - cardWidth / 2,
        y: cy - 65,
        h: 130,
        title: '',
        content: '',
        colorId: 'stone',
      }

      setCards((prev) => [...prev, newCard])
      setSelected(newCard.id)
      setTool('select')
    }

    didMove.current = false
  }, [cardWidth, pan.x, pan.y, setCards, tool, zoom])

  const handleCardPointerDown = useCallback((event, cardId) => {
    if (tool !== 'select') return

    didMove.current = false
    const card = cards.find((item) => item.id === cardId)

    if (!card) return

    draggingCard.current = {
      cardId,
      startMX: event.clientX,
      startMY: event.clientY,
      startCX: card.x,
      startCY: card.y,
    }

    setSelected(cardId)
    canvasRef.current?.setPointerCapture(event.pointerId)
  }, [cards, tool])

  const handleCardClick = useCallback((cardId) => {
    if (didMove.current) return

    if (tool === 'select') {
      setSelected(cardId)
      return
    }

    if (tool === 'connect') {
      if (!connectFrom) {
        setConnectFrom(cardId)
        return
      }

      if (connectFrom !== cardId) {
        const alreadyExists = connections.some(
          (connection) =>
            (connection.from === connectFrom && connection.to === cardId) ||
            (connection.from === cardId && connection.to === connectFrom),
        )

        if (!alreadyExists) {
          setConnections((prev) => [...prev, { id: uid(), from: connectFrom, to: cardId }])
        }

        setConnectFrom(null)
        setSvgMouse(null)
        return
      }

      setConnectFrom(null)
      setSvgMouse(null)
      return
    }

    if (tool === 'delete') {
      setCards((prev) => prev.filter((card) => card.id !== cardId))
      setConnections((prev) => prev.filter((connection) => connection.from !== cardId && connection.to !== cardId))

      if (selected === cardId) {
        setSelected(null)
      }
    }
  }, [connectFrom, connections, selected, setCards, setConnections, tool])

  const handleWheel = useCallback((event) => {
    event.preventDefault()
    const factor = event.ctrlKey ? 0.012 : 0.0008 * Math.abs(event.deltaY)
    const direction = event.deltaY > 0 ? -1 : 1

    setZoom((prev) => {
      const next = Math.max(minZoom, Math.min(maxZoom, prev + direction * factor * prev))
      const rect = canvasRef.current.getBoundingClientRect()
      const mx = event.clientX - rect.left
      const my = event.clientY - rect.top
      const cx = (mx - pan.x) / prev
      const cy = (my - pan.y) / prev
      setPan({ x: mx - cx * next, y: my - cy * next })
      return next
    })
  }, [maxZoom, minZoom, pan.x, pan.y, setPan, setZoom])

  useEffect(() => {
    const canvasElement = canvasRef.current
    if (!canvasElement) return

    canvasElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvasElement.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const fitView = useCallback(() => {
    if (!cards.length || !canvasRef.current) return

    const xs = cards.map((card) => card.x)
    const ys = cards.map((card) => card.y)
    const heights = cards.map((card) => cardHeights.current[card.id] || 130)
    const minX = Math.min(...xs) - 60
    const minY = Math.min(...ys) - 60
    const maxX = Math.max(...cards.map((card) => card.x + cardWidth)) + 60
    const maxY = Math.max(...cards.map((card, index) => card.y + heights[index])) + 60
    const viewportWidth = canvasRef.current.offsetWidth
    const viewportHeight = canvasRef.current.offsetHeight
    const nextZoom = Math.min(viewportWidth / (maxX - minX), viewportHeight / (maxY - minY), 1.5)

    setPan({
      x: (viewportWidth - (maxX - minX) * nextZoom) / 2 - minX * nextZoom,
      y: (viewportHeight - (maxY - minY) * nextZoom) / 2 - minY * nextZoom,
    })
    setZoom(nextZoom)
  }, [cardWidth, cards, setPan, setZoom])

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(maxZoom, +(prev * 1.2).toFixed(2)))
  }, [maxZoom, setZoom])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(minZoom, +(prev / 1.2).toFixed(2)))
  }, [minZoom, setZoom])

  const canvasCursor =
    tool === 'pan' ? (isPanning.current ? 'grabbing' : 'grab') :
    tool === 'card' ? 'crosshair' :
    tool === 'connect' ? 'cell' :
    'default'

  return {
    toolbarOpen,
    setToolbarOpen,
    tool,
    selected,
    connectFrom,
    svgMouse,
    canvasRef,
    cardHeights,
    switchTool,
    handleCanvasPointerDown,
    handlePointerMove,
    handlePointerUp,
    handleCardPointerDown,
    handleCardClick,
    fitView,
    handleZoomIn,
    handleZoomOut,
    canvasCursor,
  }
}
