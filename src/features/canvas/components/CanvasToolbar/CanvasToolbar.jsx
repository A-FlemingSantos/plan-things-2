export default function CanvasToolbar({
  tool,
  setTool,
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  open,
  onToggle,
  tools,
  toolIcons,
  ChevronDownIcon,
  PlusIcon,
  MinusIcon,
  FitIcon,
  styles,
}) {
  const ActiveIcon = toolIcons[tool]
  const activeTool = tools.find((candidate) => candidate.id === tool)

  return (
    <div className={styles.toolbarWrap}>
      <button
        type="button"
        className={styles.toolbarHandle}
        onClick={onToggle}
        title="Alternar barra de ferramentas"
        aria-expanded={open}
        aria-controls="canvas-toolbar-panel"
      >
        <span className={styles.toolbarHandleIcon}><ActiveIcon /></span>
        <span className={styles.toolbarHandleLabel}>{activeTool?.label}</span>
        <span className={`${styles.toolbarHandleChevron} ${open ? styles.toolbarHandleChevronUp : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {open ? (
        <div className={styles.toolbarPanel} id="canvas-toolbar-panel">
          <div className={styles.toolbarGroup}>
            {tools.map((candidate) => {
              const ToolIcon = toolIcons[candidate.id]

              return (
                <button
                  type="button"
                  key={candidate.id}
                  className={`${styles.toolbarBtn} ${tool === candidate.id ? styles.toolbarBtnActive : ''}`}
                  onClick={() => setTool(candidate.id)}
                  title={candidate.tip}
                  aria-pressed={tool === candidate.id}
                >
                  <ToolIcon />
                  <span className={styles.toolbarBtnLabel}>{candidate.label}</span>
                </button>
              )
            })}
          </div>

          <div className={styles.toolbarDivider} />

          <div className={styles.toolbarGroup}>
            <button type="button" className={styles.toolbarIconBtn} onClick={onZoomOut} title="Reduzir zoom" aria-label="Reduzir zoom">
              <MinusIcon />
            </button>
            <span className={styles.toolbarZoomLabel}>{Math.round(zoom * 100)}%</span>
            <button type="button" className={styles.toolbarIconBtn} onClick={onZoomIn} title="Aumentar zoom" aria-label="Aumentar zoom">
              <PlusIcon />
            </button>
            <div className={styles.toolbarMiniDivider} />
            <button type="button" className={styles.toolbarIconBtn} onClick={onFit} title="Ajustar à tela" aria-label="Ajustar à tela">
              <FitIcon />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
