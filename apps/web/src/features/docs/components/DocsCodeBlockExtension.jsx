import CodeBlock from '@tiptap/extension-code-block'
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import useHorizontalCustomScrollbar from '../hooks/useHorizontalCustomScrollbar.js'
import scrollStyles from './DocsCodeScroll/DocsCodeScroll.module.css'

function DocsCodeBlockView() {
  const scrollbar = useHorizontalCustomScrollbar()
  const trackClassName = [
    scrollStyles.track,
    scrollbar.thumbVisible ? '' : scrollStyles.trackHidden,
  ].filter(Boolean).join(' ')

  return (
    <NodeViewWrapper as="div" className={scrollStyles.root}>
      <pre className={scrollStyles.viewport} ref={scrollbar.viewportRef}>
        <NodeViewContent as="code" />
      </pre>
      <span className={trackClassName} aria-hidden={!scrollbar.thumbVisible}>
        <span
          ref={scrollbar.thumbRef}
          className={`${scrollStyles.thumb} ${scrollbar.isDragging ? scrollStyles.thumbDragging : ''}`}
          onPointerDown={scrollbar.handleThumbPointerDown}
        />
      </span>
    </NodeViewWrapper>
  )
}

export const DocsCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(DocsCodeBlockView)
  },
})
