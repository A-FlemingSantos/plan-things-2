const ROW_SIZE = 3
const ROW_GAP_PX = 10

export { ROW_SIZE, ROW_GAP_PX }

export function chunkResults(items, size = ROW_SIZE) {
  const rows = []
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size))
  }
  return rows
}

export function getItemAspectRatio(item, kind, measured = null) {
  if (measured?.width > 0 && measured?.height > 0) {
    return measured.width / measured.height
  }
  if (item.width > 0 && item.height > 0) {
    return item.width / item.height
  }
  return kind === 'video' ? 16 / 9 : 4 / 3
}

export function layoutEmbedRow(items, kind, dimensions = {}) {
  const aspects = items.map((item) => getItemAspectRatio(item, kind, dimensions[item.id]))
  const totalAspect = aspects.reduce((sum, aspect) => sum + aspect, 0)
  const gapTotal = ROW_GAP_PX * Math.max(items.length - 1, 0)

  return items.map((item, index) => {
    const share = aspects[index] / totalAspect
    const width = `calc((100% - ${gapTotal}px) * ${share})`
    return { item, width }
  })
}
