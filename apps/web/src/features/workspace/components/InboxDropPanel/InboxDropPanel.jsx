import { useDroppable } from '@dnd-kit/core'
import { KANBAN_INBOX_DROP_ID } from '../../hooks/boardDnDUtils.js'

export default function InboxDropPanel({
  isDropActive,
  styles,
  className,
  children,
  ...rest
}) {
  const { setNodeRef } = useDroppable({
    id: KANBAN_INBOX_DROP_ID,
    data: { type: 'inbox' },
  })

  return (
    <aside
      ref={setNodeRef}
      className={className}
      {...rest}
    >
      {children}
    </aside>
  )
}

export { KANBAN_INBOX_DROP_ID }
