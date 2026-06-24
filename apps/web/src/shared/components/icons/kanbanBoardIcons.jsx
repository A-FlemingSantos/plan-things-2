import {
  CalendarIcon,
  ChevronIcon,
  XIcon,
} from './commonIcons.jsx'

function InboxIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 3h10v10H3V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M3 9h3l1.2 2h1.6L10 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M12 2L2 6.5l4 1.5 1.5 4L12 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 8h6.4L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="3" y="6" width="8" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.8 6V4.4a2.2 2.2 0 1 1 4.4 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L8 11.1 4.5 12.9l.7-3.9L2.4 6.3l3.9-.6L8 2.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function StarFillIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L8 11.1 4.5 12.9l.7-3.9L2.4 6.3l3.9-.6L8 2.2z" fill="currentColor" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M5 5h8M5 10.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="2.5" cy="5" r=".9" fill="currentColor" />
      <circle cx="2.5" cy="10.5" r=".9" fill="currentColor" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.3 8.3l1.6 1.6 3.7-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BoardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="4" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="6" y="3" width="4" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="11" y="3" width="4" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M9.1 1.8L4.8 8h2.9L6.9 14.2 11.2 8H8.3l.8-6.2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const KanbanBoardIcons = {
  Inbox: InboxIcon,
  X: XIcon,
  Send: SendIcon,
  Trash: TrashIcon,
  Lock: LockIcon,
  Sun: SunIcon,
  Star: StarIcon,
  StarFill: StarFillIcon,
  List: ListIcon,
  CheckCircle: CheckCircleIcon,
  User: UserIcon,
  Check: CheckIcon,
  Calendar: CalendarIcon,
  Chevron: ChevronIcon,
  Board: BoardIcon,
  Bolt: BoltIcon,
}
