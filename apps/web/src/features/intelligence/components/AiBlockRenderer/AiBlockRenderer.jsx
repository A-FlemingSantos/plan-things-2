import { isProposalBlockType, isReferenceBlockType } from '../blocks/blockTypes.js'
import MarkdownBlock from '../blocks/MarkdownBlock/MarkdownBlock.jsx'
import ActionProposalBlock from '../blocks/ActionProposalBlock/ActionProposalBlock.jsx'
import CardReferenceBlock from '../blocks/CardReferenceBlock/CardReferenceBlock.jsx'
import EntityReferenceBlock from '../blocks/EntityReferenceBlock/EntityReferenceBlock.jsx'
import FileReferenceBlock from '../blocks/FileReferenceBlock/FileReferenceBlock.jsx'
import PlanReferenceBlock from '../blocks/PlanReferenceBlock/PlanReferenceBlock.jsx'
import QuestionBlock from '../blocks/QuestionBlock/QuestionBlock.jsx'
import styles from './AiBlockRenderer.module.css'

function renderBlock(block, { isStreaming = false } = {}) {
  const type = String(block?.type ?? '').toUpperCase()

  if (type === 'MARKDOWN') {
    return <MarkdownBlock markdown={block?.payload?.markdown} isStreaming={isStreaming} />
  }

  if (isProposalBlockType(type)) {
    return <ActionProposalBlock block={block} />
  }

  if (type === 'PLAN_REFERENCE') {
    return <PlanReferenceBlock block={block} />
  }

  if (type === 'CARD_REFERENCE') {
    return <CardReferenceBlock block={block} />
  }

  if (type === 'FILE_REFERENCE') {
    return <FileReferenceBlock block={block} />
  }

  if (isReferenceBlockType(type)) {
    return <EntityReferenceBlock block={block} />
  }

  if (type === 'QUESTION') {
    return <QuestionBlock block={block} />
  }

  return null
}

export default function AiBlockRenderer({ blocks = [], isStreaming = false }) {
  const sortedBlocks = [...blocks].sort((left, right) => left.position - right.position)

  if (sortedBlocks.length === 0) return null

  return (
    <div className={styles.root} data-testid="ai-block-renderer">
      {sortedBlocks.map((block) => {
        const content = renderBlock(block, { isStreaming })
        if (!content) return null

        return (
          <div key={block.id || `${block.type}-${block.position}`} className={styles.block}>
            {content}
          </div>
        )
      })}
    </div>
  )
}
