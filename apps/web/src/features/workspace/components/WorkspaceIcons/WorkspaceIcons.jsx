export function PlusIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> }
export function ImagePlusIcon(){ return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2" width="11" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M4 8l1.7-1.8a.8.8 0 0 1 1.2 0L9 8.5l1-1a.8.8 0 0 1 1.1 0L12.5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 1.5v3M9 3h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
export function SearchIcon()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
export function GridIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg> }
export function ListIcon()     { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h8M3 10h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
export function ChevronIcon()  { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
export function XIcon()        { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> }
export function CheckIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.2l3 3L11.8 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> }

export function MoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="3" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
      <circle cx="11" cy="7" r="1" fill="currentColor" />
    </svg>
  )
}

function WorkspacePlansNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="1.8" width="9" height="10.4" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 5h4M5 7h4M5 9h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function WorkspaceMembersNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="4.8" cy="4.6" r="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 11.5c.3-1.8 1.5-2.8 2.8-2.8s2.5 1 2.8 2.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="9.6" cy="5.2" r="1.3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 11.5c.4-1.3 1.2-2.1 2.1-2.1.9 0 1.7.8 2.1 2.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function WorkspaceSettingsNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 4.5h9M2.5 7h9M2.5 9.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="5.2" cy="4.5" r="1" fill="currentColor" />
      <circle cx="8.8" cy="7" r="1" fill="currentColor" />
      <circle cx="6.4" cy="9.5" r="1" fill="currentColor" />
    </svg>
  )
}

function WorkspaceLibraryNavIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 3.2v8.1c0 .6.5 1.1 1.1 1.1h2.1V2.1H3.6c-.6 0-1.1.5-1.1 1.1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.7 2.1v10.3h2.1c.6 0 1.1-.5 1.1-1.1V3.2c0-.6-.5-1.1-1.1-1.1H5.7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8.9 2.1h2.1c.6 0 1.1.5 1.1 1.1v7c0 .6-.5 1.1-1.1 1.1H8.9" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

export const WORKSPACE_SECTION_ACTIONS = [
  { id: 'plans', label: 'Planos', Icon: WorkspacePlansNavIcon },
  { id: 'members', label: 'Membros', Icon: WorkspaceMembersNavIcon },
  { id: 'settings', label: 'Configurações', Icon: WorkspaceSettingsNavIcon },
  { id: 'library', label: 'Biblioteca', Icon: WorkspaceLibraryNavIcon },
]
