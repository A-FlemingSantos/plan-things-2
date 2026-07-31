import {
  createContext,
  memo,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import useIndicatorAnchorOffset from '../../hooks/useIndicatorAnchorOffset.js'
import useSectionScrollIndicator from '../../hooks/useSectionScrollIndicator.js'
import styles from './SectionScrollArea.module.css'

const SectionScrollAreaContext = createContext(null)

function assignRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value)
    return
  }

  if (ref) {
    ref.current = value
  }
}

function SectionScrollAreaSection({
  id,
  label = '',
  className = '',
  children,
}) {
  const context = useContext(SectionScrollAreaContext)

  const setSectionRef = useCallback((node) => {
    if (!context) return

    if (node) {
      context.registerSection({
        id,
        label: label || id,
        element: node,
      })
      return
    }

    context.unregisterSection(id)
  }, [context, id, label])

  const combinedClassName = [styles.section, className].filter(Boolean).join(' ')

  return (
    <div ref={setSectionRef} className={combinedClassName} data-section-id={id}>
      {children}
    </div>
  )
}

function SectionScrollAreaIndicator({ bars, onSectionClick }) {
  return (
    <div className={styles.indicatorGroup}>
      {bars.map((bar) => (
        <button
          key={bar.id}
          type="button"
          className={styles.barButton}
          aria-label={`Ir para ${bar.label}`}
          onClick={() => onSectionClick(bar.id)}
        >
          <span
            className={styles.bar}
            style={{ width: `${bar.widthPx}px` }}
          />
        </button>
      ))}
    </div>
  )
}

function SectionScrollArea({
  children,
  enabled = true,
  refreshKey = 'default',
  className = '',
  viewportClassName = '',
  viewportTag = 'div',
  viewportProps = null,
  viewportRef = null,
  indicatorAnchorRef = null,
  minBarWidthPx,
  maxBarWidthPx,
}) {
  const viewportLocalRef = useRef(null)
  const [registeredSections, setRegisteredSections] = useState([])
  const sectionsRef = useRef(new Map())
  const indicatorOffsetTop = useIndicatorAnchorOffset({
    viewportRef: viewportLocalRef,
    anchorRef: indicatorAnchorRef,
    refreshKey,
  })

  const syncSections = useCallback(() => {
    setRegisteredSections(Array.from(sectionsRef.current.values()))
  }, [])

  const registerSection = useCallback((section) => {
    sectionsRef.current.set(section.id, section)
    syncSections()
  }, [syncSections])

  const unregisterSection = useCallback((sectionId) => {
    sectionsRef.current.delete(sectionId)
    syncSections()
  }, [syncSections])

  const contextValue = useMemo(() => ({
    registerSection,
    unregisterSection,
  }), [registerSection, unregisterSection])

  const setViewportRef = useCallback((node) => {
    viewportLocalRef.current = node
    assignRef(viewportRef, node)
  }, [viewportRef])

  const sectionRefreshKey = registeredSections.map((section) => section.id).join('|')

  const { bars, scrollToSection, indicatorVisible } = useSectionScrollIndicator({
    viewportRef: viewportLocalRef,
    sections: registeredSections,
    enabled,
    refreshKey: `${refreshKey}:${sectionRefreshKey}`,
    minBarWidthPx,
    maxBarWidthPx,
  })

  const ViewportTag = viewportTag
  const viewportRest = viewportProps ?? {}
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')
  const viewportCombinedClassName = [styles.viewport, viewportClassName].filter(Boolean).join(' ')
  const indicatorClassName = [
    styles.indicator,
    indicatorVisible ? '' : styles.indicatorHidden,
  ].filter(Boolean).join(' ')

  return (
    <SectionScrollAreaContext.Provider value={contextValue}>
      <div className={rootClassName}>
        <ViewportTag
          {...viewportRest}
          ref={setViewportRef}
          className={viewportCombinedClassName}
        >
          {children}
        </ViewportTag>
        <div
          className={indicatorClassName}
          style={{
            '--section-scroll-indicator-offset-top': `${indicatorOffsetTop}px`,
          }}
        >
          <SectionScrollAreaIndicator
            bars={bars}
            onSectionClick={scrollToSection}
          />
        </div>
      </div>
    </SectionScrollAreaContext.Provider>
  )
}

const MemoSectionScrollArea = memo(SectionScrollArea)
MemoSectionScrollArea.Section = SectionScrollAreaSection

export { SectionScrollAreaSection }
export default MemoSectionScrollArea
