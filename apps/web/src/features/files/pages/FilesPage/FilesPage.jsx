import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { apiRequest, triggerBlobDownload } from '../../../../shared/api/apiClient.js'
import { buildLibraryTreeFromApi } from '../../../../shared/contracts/backendAdapters.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import SidebarAccountMenu from '../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx'
import { ROUTES } from '../../../../shared/config/routes.js'
import { useWorkspaceNavigation } from '../../../../shared/hooks/useWorkspaceNavigation.js'
import { createClientId } from '../../../../shared/utils/createClientId.js'
import {
  createInitialLibrarySnapshot,
  createLibraryItem,
  flattenLibrary,
  formatFileSize,
  getFileTypeFromName,
  insertLibraryItem,
  markLibraryItemDeleted,
  pathsMatch,
  updateLibraryItem,
} from '../../data/libraryRepository.js'
import styles from './FilesPage.module.css'

/* ═══════════════════════════════════════════
   ICONS
═══════════════════════════════════════════ */
const Icon = {
  Logo:       () => <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".35"/><rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55"/><rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75"/></svg>,
  Home:       () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Canvas:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Calendar:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1.8v2.8M11 1.8v2.8M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Files:      () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V6L9 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V6H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Chevron:    () => <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ChevronDown:() => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Collapse:   () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Popover:    () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2.5H2.5v7H9.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7L9.5 2.5M7 2.5h2.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Grid:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  List:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h8M3 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Upload:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 9V2M4.5 4.5L7 2l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10v1.5A1.5 1.5 0 0 0 3.5 13h7a1.5 1.5 0 0 0 1.5-1.5V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  Plus:       () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Search:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Folder:     () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 5a2 2 0 0 1 2-2h3.586a1 1 0 0 1 .707.293L9.707 4.707A1 1 0 0 0 10.414 5H16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z" fill="currentColor"/></svg>,
  FolderSm:   () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h2.5a1 1 0 0 1 .707.293L7.207 3.293A1 1 0 0 0 7.914 3.586L11 3.5A1.5 1.5 0 0 1 12.5 5v5.5A1.5 1.5 0 0 1 11 12H3a1.5 1.5 0 0 1-1.5-1.5v-7z" fill="currentColor"/></svg>,
  FileText:   () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2h7l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 9h6M7 12h6M7 15h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  FileImg:    () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2h7l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="8" cy="10" r="1.5" fill="currentColor" opacity=".4"/><path d="M5 16l3-3 2 2 2-2.5L15 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  FilePdf:    () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2h7l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><text x="5" y="15.5" fontSize="5" fill="currentColor" fontWeight="700" fontFamily="sans-serif">PDF</text></svg>,
  FileCode:   () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2h7l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 10l-2 2 2 2M12 10l2 2-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  FileZip:    () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2h7l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9.5 8v8M9.5 8h1M9.5 10h1M9.5 12h1M9.5 14h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  FileGeneric:() => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2h7l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Star:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L7 9.6l-3.2 1.8.6-3.6L1.8 5.3l3.6-.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  StarFill:   () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L7 9.6l-3.2 1.8.6-3.6L1.8 5.3l3.6-.5z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  Clock:      () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Share:      () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4.4 7.8L9.7 10M9.7 4L4.4 6.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Download:   () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v7M4.5 6.5L7 9l2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10v1.5A1.5 1.5 0 0 0 3.5 13h7a1.5 1.5 0 0 0 1.5-1.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Trash:      () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 8h6.4L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Edit:       () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Copy:       () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9 5V3.5A1.5 1.5 0 0 0 7.5 2H3A1.5 1.5 0 0 0 1.5 3.5V8A1.5 1.5 0 0 0 3 9.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Move:       () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M4 5l3-3 3 3M4 9l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  More:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3.5" cy="7" r="1.1" fill="currentColor"/><circle cx="7" cy="7" r="1.1" fill="currentColor"/><circle cx="10.5" cy="7" r="1.1" fill="currentColor"/></svg>,
  X:          () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Link:       () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M6 8.5l-1.5 1.5a2.5 2.5 0 0 1-3.535-3.535L4.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8 5.5l1.5-1.5A2.5 2.5 0 0 1 13.035 7.5L9.5 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M5 9l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Info:       () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 6.5v4M7 4.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  CloudUp:    () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 16.5A4.5 4.5 0 0 1 7 7.5a4.5 4.5 0 0 1 8.1-2.7A3.5 3.5 0 0 1 18 8.5a3.5 3.5 0 0 1 0 7H7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M12 19v-7M9.5 14.5L12 12l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Trash2:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 4V2.5h4V4M6.5 7v5M9.5 7v5M3 4l.9 9.5h8.2L13 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  MyFiles:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h3.586a1 1 0 0 1 .707.293L9.207 4.707A1 1 0 0 0 9.914 5H12.5A1.5 1.5 0 0 1 14 6.5V12A1.5 1.5 0 0 1 12.5 13.5h-9A1.5 1.5 0 0 1 2 12V4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Shared:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 14c0-2.8 2.2-5 5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Recent:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v3.5L10.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  StarMenu:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.8 3.7L14 6.3l-3 2.9.7 4.1L8 11.3l-3.7 2 .7-4.1-3-2.9 4.2-.6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Settings:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.27 1.27M11.33 11.33l1.27 1.27M12.6 3.4l-1.27 1.27M4.67 11.33l-1.27 1.27" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Filter:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Sort:       () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h8M2 7h5M2 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 3v8M9 9l2 2 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Eye:        () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>,
  NewFolder:  () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h2.5a1 1 0 0 1 .707.293L7.207 3.293A1 1 0 0 0 7.914 3.5L11 3.5A1.5 1.5 0 0 1 12.5 5v5.5A1.5 1.5 0 0 1 11 12H3a1.5 1.5 0 0 1-1.5-1.5v-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7 7v3M5.5 8.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
}

/* ═══════════════════════════════════════════
   FILE DATA
═══════════════════════════════════════════ */
const FILE_TYPES = {
  folder:  { icon: Icon.Folder,      color: '#f5a623', bg: '#fff8ed' },
  image:   { icon: Icon.FileImg,     color: '#4290da', bg: '#f0f7ff' },
  pdf:     { icon: Icon.FilePdf,     color: '#d94f4f', bg: '#fff4f4' },
  doc:     { icon: Icon.FileText,    color: '#0f703a', bg: '#f0fbf4' },
  code:    { icon: Icon.FileCode,    color: '#9b7ec8', bg: '#f7f3ff' },
  zip:     { icon: Icon.FileZip,     color: '#a0a0a0', bg: '#f5f5f5' },
  generic: { icon: Icon.FileGeneric, color: '#a0a0a0', bg: '#f5f5f5' },
}

const SIDEBAR_NAV = [
  { id: 'home',     label: 'Início',   Icon: Icon.Home,     path: ROUTES.workspace },
  { id: 'canvas',   label: 'Canvas',   Icon: Icon.Canvas,   path: ROUTES.canvas },
  { id: 'calendar', label: 'Calendário', Icon: Icon.Calendar, path: ROUTES.calendar },
  { id: 'files',    label: 'Arquivos', Icon: Icon.Files,    path: ROUTES.files },
]

const STORAGE_USED = 28.4  // GB
const STORAGE_TOTAL = 100  // GB

/* ═══════════════════════════════════════════
   IMAGE PREVIEWS (gradient placeholders)
═══════════════════════════════════════════ */
const IMG_GRADIENTS = {
  'hero-mockup.png':    'linear-gradient(135deg,#4290da,#d4aef1)',
  'fluxo-onboarding.png':'linear-gradient(135deg,#0f703a,#4290da)',
  'animacao-hero.gif': 'linear-gradient(135deg,#ff6766,#f5a623)',
  'foto-capa.jpg':    'linear-gradient(135deg,#d4aef1,#ff6766)',
}

function formatOwner(owner) {
  return owner === 'me' ? 'Eu' : owner
}

/* ═══════════════════════════════════════════
   CONTEXT MENU
═══════════════════════════════════════════ */
function ContextMenu({ x, y, item, onAction, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const keyHandler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', keyHandler) }
  }, [onClose])

  const actions = item.type === 'folder'
    ? [
        { id: 'open',     label: 'Abrir',           Icon: Icon.Folder, shortcut: 'Enter' },
        { id: 'share',    label: 'Compartilhar',    Icon: Icon.Share },
        { id: 'copy',     label: 'Copiar link',     Icon: Icon.Link, shortcut: '⌘C' },
        null,
        { id: 'rename',   label: 'Renomear',        Icon: Icon.Edit, shortcut: 'R' },
        { id: 'move',     label: 'Mover para',      Icon: Icon.Move },
        null,
        { id: 'delete',   label: 'Excluir',         Icon: Icon.Trash, danger: true, shortcut: 'Del' },
      ]
    : [
        { id: 'preview',  label: 'Prévia',          Icon: Icon.Eye, shortcut: 'Space' },
        { id: 'download', label: 'Baixar',          Icon: Icon.Download },
        { id: 'share',    label: 'Compartilhar',    Icon: Icon.Share },
        { id: 'copy',     label: 'Copiar link',     Icon: Icon.Link, shortcut: '⌘C' },
        null,
        { id: 'star',     label: item.starred ? 'Remover estrela' : 'Favoritar', Icon: item.starred ? Icon.StarFill : Icon.Star },
        { id: 'rename',   label: 'Renomear',        Icon: Icon.Edit, shortcut: 'R' },
        { id: 'move',     label: 'Mover para',      Icon: Icon.Move },
        null,
        { id: 'delete',   label: 'Excluir',         Icon: Icon.Trash, danger: true, shortcut: 'Del' },
      ]

  // Clamp to viewport
  const menuW = 192, menuH = 300
  const left = Math.min(x, window.innerWidth - menuW - 8)
  const top  = Math.min(y, window.innerHeight - menuH - 8)

  return (
    <div ref={ref} className={styles.contextMenu} style={{ left, top }}>
      {actions.map((a, i) =>
        a === null
          ? <div key={i} className={styles.contextMenuDivider} />
          : <button key={a.id} className={`${styles.contextMenuBtn} ${a.danger ? styles.contextMenuDanger : ''}`} onClick={() => onAction(a.id, item)}>
              <span className={styles.contextMenuIcon}><a.Icon /></span>
              <span className={styles.contextMenuLabel}>{a.label}</span>
              {a.shortcut && <span className={styles.contextMenuShortcut}>{a.shortcut}</span>}
            </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   RENAME INLINE
═══════════════════════════════════════════ */
function RenameInput({ value, onConfirm, onCancel }) {
  const [val, setVal] = useState(value)
  const ref = useRef(null)

  useEffect(() => { ref.current?.select() }, [])

  return (
    <input
      ref={ref}
      className={styles.renameInput}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => onConfirm(val)}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); onConfirm(val) }
        if (e.key === 'Escape') { e.preventDefault(); onCancel() }
      }}
      onClick={e => e.stopPropagation()}
    />
  )
}

/* ═══════════════════════════════════════════
   FILE CARD (grid)
═══════════════════════════════════════════ */
function FileCard({ item, selected, onSelect, onOpen, onContextMenu, onToggleStar, renamingId, onRename, onRenameCancel }) {
  const typeInfo = FILE_TYPES[item.type] || FILE_TYPES.generic
  const FileIcon = typeInfo.icon
  const isRenaming = renamingId === item.id
  const imgGrad = IMG_GRADIENTS[item.name]

  return (
    <div
      className={`${styles.fileCard} ${selected ? styles.fileCardSelected : ''}`}
      onClick={e => { e.stopPropagation(); onSelect(item.id) }}
      onDoubleClick={() => onOpen(item)}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, item) }}
    >
      {/* Thumbnail */}
      <div className={styles.fileCardThumb} style={{ background: imgGrad || typeInfo.bg }}>
        {imgGrad ? (
          <div className={styles.fileCardImgPreview} style={{ background: imgGrad }} />
        ) : (
          <span className={styles.fileCardIcon} style={{ color: typeInfo.color }}>
            <FileIcon />
          </span>
        )}
        {/* Top actions */}
        <div className={styles.fileCardActions}>
          <button
            className={`${styles.fileCardActionBtn} ${item.starred ? styles.fileCardActionBtnActive : ''}`}
            onClick={e => { e.stopPropagation(); onToggleStar(item.id) }}
            title={item.starred ? 'Remover estrela' : 'Favoritar'}
          >
            {item.starred ? <Icon.StarFill /> : <Icon.Star />}
          </button>
          <button
            className={styles.fileCardActionBtn}
            onClick={e => { e.stopPropagation(); onContextMenu(e, item) }}
            title="Mais opções"
          >
            <Icon.More />
          </button>
        </div>
        {item.shared && <span className={styles.sharedBadge}>Compartilhado</span>}
      </div>

      {/* Footer */}
      <div className={styles.fileCardFooter}>
        {isRenaming ? (
          <RenameInput value={item.name} onConfirm={v => onRename(item.id, v)} onCancel={onRenameCancel} />
        ) : (
          <p className={styles.fileCardName} title={item.name}>{item.name}</p>
        )}
        <div className={styles.fileCardMeta}>
          <span className={styles.fileCardDate}>{item.modified}</span>
            {item.size > 0 && <span className={styles.fileCardSize}>{formatFileSize(item.size)}</span>}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   FILE ROW (list)
═══════════════════════════════════════════ */
function FileRow({ item, selected, onSelect, onOpen, onContextMenu, onToggleStar, renamingId, onRename, onRenameCancel }) {
  const typeInfo = FILE_TYPES[item.type] || FILE_TYPES.generic
  const FileIcon = typeInfo.icon
  const isRenaming = renamingId === item.id

  return (
    <div
      className={`${styles.fileRow} ${selected ? styles.fileRowSelected : ''}`}
      onClick={e => { e.stopPropagation(); onSelect(item.id) }}
      onDoubleClick={() => onOpen(item)}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, item) }}
    >
      <div className={styles.fileRowLeft}>
        <span className={styles.fileRowIcon} style={{ color: typeInfo.color, background: typeInfo.bg }}>
          <FileIcon />
        </span>
        <div className={styles.fileRowName}>
          {isRenaming ? (
            <RenameInput value={item.name} onConfirm={v => onRename(item.id, v)} onCancel={onRenameCancel} />
          ) : (
            <span className={styles.fileRowNameText}>{item.name}</span>
          )}
          {item.shared && <span className={styles.fileRowShared}>Compartilhado</span>}
        </div>
      </div>
      <div className={styles.fileRowMeta}>
        <span className={styles.fileRowOwner}>{formatOwner(item.owner)}</span>
        <span className={styles.fileRowDate}>{item.modified}</span>
          <span className={styles.fileRowSize}>{formatFileSize(item.size)}</span>
        <div className={styles.fileRowActions}>
          <button
            className={`${styles.fileRowBtn} ${item.starred ? styles.fileRowBtnActive : ''}`}
            onClick={e => { e.stopPropagation(); onToggleStar(item.id) }}
          >
            {item.starred ? <Icon.StarFill /> : <Icon.Star />}
          </button>
          <button className={styles.fileRowBtn} onClick={e => { e.stopPropagation(); onContextMenu(e, item) }}>
            <Icon.More />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   DETAIL PANEL
═══════════════════════════════════════════ */
function DetailPanel({ item, onClose, onToggleStar, onAction }) {
  const typeInfo = FILE_TYPES[item.type] || FILE_TYPES.generic
  const FileIcon = typeInfo.icon
  const imgGrad = IMG_GRADIENTS[item.name]
  const typeLabel = item.type === 'folder' ? 'Pasta' : 'Arquivo'
  const ownerLabel = item.owner === 'me' ? 'Arthur Santos' : item.owner
  const activityRows = [
    `${item.owner === 'me' ? 'Você' : item.owner} atualizou ${item.type === 'folder' ? 'esta pasta' : 'este arquivo'} ${item.modified.toLowerCase()}`,
    item.shared ? 'Compartilhado com o workspace de produto' : 'Só você acessa este item',
    item.starred ? 'Fixado nos favoritos' : 'Ainda sem estrela',
  ]

  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailPanelHeader}>
        <div>
          <p className={styles.detailPanelEyebrow}>Inspetor</p>
          <p className={styles.detailPanelTitle}>Info do arquivo</p>
        </div>
        <button className={styles.detailPanelClose} onClick={onClose}><Icon.X /></button>
      </div>

      <div className={styles.detailPanelPreview} style={{ background: imgGrad || typeInfo.bg }}>
        {imgGrad
          ? <div className={styles.detailPanelImg} style={{ background: imgGrad }} />
          : <span style={{ color: typeInfo.color }}><FileIcon /></span>
        }
      </div>

      <div className={styles.detailPanelBody}>
        <div className={styles.detailPanelSummary}>
          <p className={styles.detailPanelName}>{item.name}</p>
          <span className={styles.detailPanelType}>{typeLabel} · {formatFileSize(item.size)}</span>
        </div>

        <div className={styles.detailPanelActions}>
          <button className={styles.detailAction} onClick={() => onAction('download', item)}>
            <Icon.Download /> Baixar
          </button>
          <button className={styles.detailAction} onClick={() => onAction('share', item)}>
            <Icon.Share /> Compartilhar
          </button>
          <button
            className={`${styles.detailAction} ${item.starred ? styles.detailActionActive : ''}`}
            onClick={() => onToggleStar(item.id)}
          >
            {item.starred ? <Icon.StarFill /> : <Icon.Star />}
            {item.starred ? 'Favorito' : 'Favoritar'}
          </button>
        </div>

        <div className={styles.detailTabs} aria-label="Seções do inspetor">
          <button className={`${styles.detailTab} ${styles.detailTabActive}`}>Detalhes</button>
          <button className={styles.detailTab}>Atividade</button>
          <button className={styles.detailTab}>Versões</button>
          <button className={styles.detailTab}>Compartilhamento</button>
        </div>

        <div className={styles.detailSection}>
          <p className={styles.detailSectionTitle}>Propriedades</p>
          <div className={styles.detailMeta}>
            {[
              { label: 'Tipo',      value: typeLabel },
              { label: 'Tamanho',   value: formatFileSize(item.size) },
              { label: 'Modificado', value: item.modified },
              { label: 'Dono',      value: ownerLabel },
              { label: 'Compartilhado', value: item.shared ? 'Sim, com a equipe' : 'Não' },
            ].map(row => (
              <div key={row.label} className={styles.detailMetaRow}>
                <span className={styles.detailMetaLabel}>{row.label}</span>
                <span className={styles.detailMetaValue}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.detailSection}>
          <p className={styles.detailSectionTitle}>Atividade recente</p>
          <div className={styles.detailActivity}>
            {activityRows.map(row => (
              <div key={row} className={styles.detailActivityRow}>
                <span className={styles.detailActivityDot} />
                <span>{row}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.detailSharingCard}>
          <div>
            <p className={styles.detailSharingTitle}>{item.shared ? 'Acesso da equipe' : 'Arquivo privado'}</p>
            <p className={styles.detailSharingText}>
              {item.shared ? 'Todos no workspace podem ver a versão mais recente.' : 'Compartilhe um link quando estiver pronto para review.'}
            </p>
          </div>
          <button className={styles.detailSharingBtn} onClick={() => onAction('share', item)}>Gerenciar</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   UPLOAD TOAST
═══════════════════════════════════════════ */
function UploadToast({ uploads, onDismiss }) {
  if (!uploads.length) return null
  return (
    <div className={styles.uploadToast}>
      {uploads.map(u => (
        <div key={u.id} className={styles.uploadToastItem}>
          <span className={styles.uploadToastIcon}><Icon.Upload /></span>
          <div className={styles.uploadToastInfo}>
            <p className={styles.uploadToastName}>{u.name}</p>
            <div className={styles.uploadToastBar}>
              <div className={styles.uploadToastFill} style={{ width: `${u.progress}%` }} />
            </div>
          </div>
          <span className={styles.uploadToastPct}>{u.progress}%</span>
          {u.progress === 100 && (
            <button className={styles.uploadToastDismiss} onClick={() => onDismiss(u.id)}><Icon.X /></button>
          )}
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN FILES PAGE
═══════════════════════════════════════════ */
export default function FilesPage() {
  const { accessToken, isAuthenticated, isDemoSession } = useAuth()
  const backendEnabled = isAuthenticated && !isDemoSession
  const { activeNav, handleNavItemClick } = useWorkspaceNavigation()
  const [sidebarSection, setSidebarSection]     = useState('my-files') // my-files | recent | starred | shared | trash
  const [view, setView]                         = useState('grid')
  const [search, setSearch]                     = useState('')
  const [currentPath, setCurrentPath]           = useState([]) // array of folder ids
  const [library, setLibrary]                   = useState(createInitialLibrarySnapshot)
  const [selected, setSelected]                 = useState(null)
  const [detailItemId, setDetailItemId]         = useState(null)
  const [contextMenu, setContextMenu]           = useState(null) // { x, y, item }
  const [renamingId, setRenamingId]             = useState(null)
  const [dragOver, setDragOver]                 = useState(false)
  const [uploads, setUploads]                   = useState([])
  const [sortBy, setSortBy]                     = useState('modified') // modified | name | size
  const [notification, setNotification]         = useState(null)
  const notificationTimerRef = useRef(null)
  const uploadIntervalsRef = useRef(new Map())
  const fileInputRef = useRef(null)

  const reloadLibrary = useCallback(async (trash = false) => {
    if (!backendEnabled) return

    try {
      const items = await apiRequest('/api/files', {
        token: accessToken,
        query: { trash },
      })

      setLibrary(buildLibraryTreeFromApi(items))
    } catch (error) {
      console.error(error)
    }
  }, [accessToken, backendEnabled])

  useEffect(() => {
    if (!backendEnabled) {
      setLibrary(createInitialLibrarySnapshot())
      return
    }

    reloadLibrary(sidebarSection === 'trash')
  }, [backendEnabled, reloadLibrary, sidebarSection])

  const flattenedItems = useMemo(() => flattenLibrary(library), [library])
  const itemById = useMemo(() => new Map(flattenedItems.map((item) => [item.id, item])), [flattenedItems])
  const breadcrumb = currentPath.map((id) => itemById.get(id)).filter(Boolean)
  const detailItem = detailItemId ? itemById.get(detailItemId) || null : null

  useEffect(() => {
    if (currentPath.some((id) => !itemById.has(id))) {
      setCurrentPath([])
    }
  }, [currentPath, itemById])

  // Navigate into folder
  const openItem = (item) => {
    if (item.type === 'folder') {
      setSidebarSection('my-files')
      setCurrentPath([...item.pathIds, item.id])
      setSelected(null)
      setDetailItemId(null)
    }
  }

  const navigateBreadcrumb = (idx) => {
    if (idx === -1) {
      setCurrentPath([])
    } else {
      setCurrentPath(currentPath.slice(0, idx + 1))
    }
    setSelected(null)
    setDetailItemId(null)
  }

  // Section filtering
  const filteredFiles = useMemo(() => {
    let base = flattenedItems.filter((item) => !item.isDeletedTree)

    if (sidebarSection === 'my-files') {
      base = base.filter((item) => pathsMatch(item.pathIds, currentPath))
    }

    if (sidebarSection === 'starred') base = base.filter((item) => item.starred)
    if (sidebarSection === 'shared') base = base.filter((item) => item.shared)
    if (sidebarSection === 'recent') base = base.slice(0, 6)
    if (sidebarSection === 'trash') base = flattenedItems.filter((item) => item.deleted)

    if (search) {
      base = base.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    }

    return [...base].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1
      if (b.type === 'folder' && a.type !== 'folder') return 1
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'size') return b.size - a.size
      return 0
    })
  }, [currentPath, flattenedItems, search, sidebarSection, sortBy])

  const handleContextAction = useCallback(async (action, item) => {
    setContextMenu(null)
    if (action === 'star' || action === 'unstar') {
      setLibrary((prev) =>
        updateLibraryItem(prev, item.id, (current) => ({ ...current, starred: !current.starred })),
      )
    } else if (action === 'rename') {
      setRenamingId(item.id)
    } else if (action === 'delete') {
      if (backendEnabled) {
        await apiRequest(`/api/files/${item.id}`, {
          method: 'DELETE',
          token: accessToken,
        }).catch((error) => {
          console.error(error)
        })
        await reloadLibrary(sidebarSection === 'trash')
      } else {
        setLibrary((prev) => updateLibraryItem(prev, item.id, markLibraryItemDeleted))
      }
      if (detailItemId === item.id) setDetailItemId(null)
      if (selected === item.id) setSelected(null)
      showNotification(`"${item.name}" movido para a lixeira`)
    } else if (action === 'download') {
      if (backendEnabled && item.type !== 'folder') {
        const blob = await apiRequest(`/api/files/${item.id}/download`, {
          token: accessToken,
          responseType: 'blob',
        }).catch((error) => {
          console.error(error)
          return null
        })

        if (blob) {
          triggerBlobDownload(blob, item.name)
        }
      }
      showNotification(`Baixando "${item.name}"...`)
    } else if (action === 'share') {
      showNotification(`Link de "${item.name}" copiado`)
    } else if (action === 'copy') {
      showNotification('Link copiado')
    } else if (action === 'open') {
      openItem(item)
    } else if (action === 'preview') {
      setDetailItemId(item.id)
      showNotification(`Prévia de "${item.name}"`)
    } else if (action === 'move') {
      showNotification(`Opções de mover abertas para "${item.name}"`)
    }
  }, [accessToken, backendEnabled, detailItemId, reloadLibrary, selected, sidebarSection])

  const showNotification = (msg) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
    setNotification(msg)
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null)
      notificationTimerRef.current = null
    }, 2800)
  }

  useEffect(() => () => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }

    uploadIntervalsRef.current.forEach((intervalId) => {
      clearInterval(intervalId)
    })
    uploadIntervalsRef.current.clear()
  }, [])

  const handleRename = (id, newName) => {
    if (newName.trim()) {
      setLibrary((prev) =>
        updateLibraryItem(prev, id, (current) => ({ ...current, name: newName.trim() })),
      )
    }
    setRenamingId(null)
  }

  const toggleStar = (id) => {
    setLibrary((prev) =>
      updateLibraryItem(prev, id, (current) => ({ ...current, starred: !current.starred })),
    )
  }

  // Upload simulation
  const simulateUpload = async (fileLike) => {
    const name = typeof fileLike === 'string' ? fileLike : fileLike.name
    const id = createClientId('upload')
    setUploads(prev => [...prev, { id, name, progress: 0 }])

    if (backendEnabled && fileLike instanceof File) {
      const formData = new FormData()
      formData.append('file', fileLike)
      const parentId = sidebarSection === 'my-files' ? currentPath[currentPath.length - 1] : null

      setUploads((prev) => prev.map((upload) => upload.id === id ? { ...upload, progress: 40 } : upload))

      try {
        await apiRequest('/api/files/upload', {
          method: 'POST',
          token: accessToken,
          body: formData,
          query: parentId ? { parentId } : undefined,
        })

        setUploads((prev) => prev.map((upload) => upload.id === id ? { ...upload, progress: 100 } : upload))
        await reloadLibrary(sidebarSection === 'trash')
        showNotification(`"${name}" enviado`)
      } catch (error) {
        console.error(error)
      }

      return
    }

    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 22 + 8
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        uploadIntervalsRef.current.delete(id)
      }
      setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: Math.round(p) } : u))
      if (p === 100) {
        const newFile = {
          name, type: getFileTypeFromName(name),
          size: Math.floor(Math.random() * 5000000 + 50000),
          modified: 'Agora', starred: false, shared: false, owner: 'me', deleted: false,
        }
        const targetPath = sidebarSection === 'my-files' ? currentPath : []
        setLibrary((prev) => insertLibraryItem(prev, targetPath, newFile))
        setSidebarSection('my-files')
        showNotification(`"${name}" enviado`)
      }
    }, 180)
    uploadIntervalsRef.current.set(id, interval)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    Array.from(e.dataTransfer.files).forEach(f => simulateUpload(backendEnabled ? f : f.name))
  }

  const handleFileInput = (e) => {
    Array.from(e.target.files).forEach(f => simulateUpload(backendEnabled ? f : f.name))
    e.target.value = ''
  }

  const handleNewFolder = async () => {
    if (backendEnabled) {
      const parentId = sidebarSection === 'my-files' ? currentPath[currentPath.length - 1] : null

      try {
        const createdFolder = await apiRequest('/api/files/folders', {
          method: 'POST',
          token: accessToken,
          query: {
            name: 'Nova pasta',
            parentId,
          },
        })

        await reloadLibrary(sidebarSection === 'trash')
        setSidebarSection('my-files')
        setTimeout(() => setRenamingId(createdFolder.id), 80)
        showNotification('Pasta criada')
      } catch (error) {
        console.error(error)
      }

      return
    }

    const folder = createLibraryItem({
      name: 'Nova pasta',
      type: 'folder',
      modified: 'Agora',
    })
    const targetPath = sidebarSection === 'my-files' ? currentPath : []
    setLibrary((prev) => insertLibraryItem(prev, targetPath, folder))
    setSidebarSection('my-files')
    setTimeout(() => setRenamingId(folder.id), 80)
    showNotification('Pasta criada')
  }

  const dismissUpload = (id) => {
    const interval = uploadIntervalsRef.current.get(id)

    if (interval) {
      clearInterval(interval)
      uploadIntervalsRef.current.delete(id)
    }

    setUploads(prev => prev.filter(u => u.id !== id))
  }

  const handleCanvasBackground = (e) => {
    if (e.target === e.currentTarget) {
      setSelected(null)
      setDetailItemId(null)
    }
  }

  const sectionLabel = {
    'my-files': 'Meus arquivos',
    'recent':   'Recentes',
    'starred':  'Favoritos',
    'shared':   'Compartilhados',
    'trash':    'Lixeira',
  }[sidebarSection]

  const selectedItem = selected ? filteredFiles.find((item) => item.id === selected) || detailItem : null
  const emptyState = search
    ? {
        icon: Icon.Search,
        title: `Sem resultados para "${search}"`,
        hint: 'Tente outro nome, dono ou tipo.',
        action: 'Limpar busca',
        onAction: () => setSearch(''),
      }
    : {
        'my-files': {
          icon: Icon.CloudUp,
          title: 'Traga seu trabalho para Arquivos',
          hint: 'Envie documentos, imagens e pastas para o workspace.',
          action: 'Enviar arquivos',
          onAction: () => fileInputRef.current?.click(),
        },
        recent: {
          icon: Icon.Recent,
          title: 'Sem atividade recente',
          hint: 'Arquivos abertos, enviados ou atualizados aparecem aqui.',
        },
        starred: {
          icon: Icon.StarMenu,
          title: 'Sem favoritos',
          hint: 'Marque trabalhos importantes para achá-los rápido.',
        },
        shared: {
          icon: Icon.Shared,
          title: 'Nada compartilhado',
          hint: 'Docs da equipe e links de review aparecem aqui.',
        },
        trash: {
          icon: Icon.Trash2,
          title: 'Lixeira vazia',
          hint: 'Arquivos excluídos aparecem aqui antes de sumirem de vez.',
        },
      }[sidebarSection]
  const EmptyIcon = emptyState.icon

  const storagePercent = (STORAGE_USED / STORAGE_TOTAL) * 100
  const renderSidebarSecondaryContent = ({ collapsed }) => (
    <>
      {!collapsed && (
        <div className={styles.filesNav}>
          <p className={styles.filesNavLabel}>Arquivos</p>
          {[
            { id: 'my-files', label: 'Meus arquivos', Ic: Icon.MyFiles },
            { id: 'recent',   label: 'Recentes',      Ic: Icon.Recent },
            { id: 'starred',  label: 'Favoritos',     Ic: Icon.StarMenu },
            { id: 'shared',   label: 'Compartilhados', Ic: Icon.Shared },
            { id: 'trash',    label: 'Lixeira',       Ic: Icon.Trash2 },
          ].map(({ id, label, Ic }) => (
            <button
              key={id}
              className={`${styles.filesNavItem} ${sidebarSection === id ? styles.filesNavItemActive : ''}`}
              onClick={() => {
                setSidebarSection(id)
                setCurrentPath([])
                setSelected(null)
                setDetailItemId(null)
              }}
            >
              <span className={styles.filesNavIcon}><Ic /></span>
              {label}
            </button>
          ))}
        </div>
      )}

      {!collapsed && (
        <div className={styles.storageSection}>
          <div className={styles.storageHeader}>
            <span className={styles.storageLabel}>Armazenamento</span>
            <span className={styles.storageNums}>{STORAGE_USED} / {STORAGE_TOTAL} GB</span>
          </div>
          <div className={styles.storageBar}>
            <div
              className={styles.storageBarFill}
              style={{ width: `${storagePercent}%`, background: storagePercent > 80 ? 'var(--color-red)' : 'var(--color-black)' }}
            />
          </div>
          <p className={styles.storageInfo}>{(STORAGE_TOTAL - STORAGE_USED).toFixed(1)} GB disponíveis</p>
        </div>
      )}
    </>
  )

  const renderSidebarBottomContent = ({ collapsed }) => (
    <SidebarAccountMenu styles={styles} collapsed={collapsed} />
  )

  return (
    <>
      <ProductAppShell
      styles={styles}
      activeNav={activeNav}
      onNavItemClick={handleNavItemClick}
      navItems={SIDEBAR_NAV.map(({ id, label, Icon: IconComponent, hint }) => ({
        id,
        label,
        Icon: IconComponent,
        hint,
      }))}
      LogoIcon={Icon.Logo}
      CollapseIcon={Icon.Collapse}
      ChevronIcon={Icon.Chevron}
      HintIcon={Icon.Popover}
      secondaryContent={renderSidebarSecondaryContent}
      bottomContent={renderSidebarBottomContent}
      contentClassName={styles.main}
    >

        {/* Top bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb}>
              <button
                className={`${styles.breadcrumbItem} ${breadcrumb.length === 0 ? styles.breadcrumbItemActive : ''}`}
                onClick={() => navigateBreadcrumb(-1)}
              >
                {sectionLabel}
              </button>
              {breadcrumb.map((crumb, i) => (
                <span key={i} className={styles.breadcrumbGroup}>
                  <span className={styles.breadcrumbSep}><Icon.Chevron /></span>
                  <button
                    className={`${styles.breadcrumbItem} ${i === breadcrumb.length - 1 ? styles.breadcrumbItemActive : ''}`}
                    onClick={() => navigateBreadcrumb(i)}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </nav>
          </div>

          <div className={styles.topBarRight}>
            {selectedItem ? (
              <div className={styles.selectionToolbar}>
                <span className={styles.selectionCount}>1 selecionado</span>
                <button className={styles.selectionAction} onClick={() => handleContextAction('download', selectedItem)}><Icon.Download /> Baixar</button>
                <button className={styles.selectionAction} onClick={() => handleContextAction('share', selectedItem)}><Icon.Share /> Compartilhar</button>
                <button className={styles.selectionAction} onClick={() => handleContextAction('move', selectedItem)}><Icon.Move /> Mover</button>
                <button className={`${styles.selectionAction} ${styles.selectionDanger}`} onClick={() => handleContextAction('delete', selectedItem)}><Icon.Trash /> Excluir</button>
                <button className={styles.selectionClear} onClick={() => { setSelected(null); setDetailItemId(null) }}><Icon.X /></button>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className={styles.searchWrap}>
                  <span className={styles.searchIcon}><Icon.Search /></span>
                  <input
                    className={styles.searchInput}
                    placeholder="Buscar arquivos..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && <button className={styles.searchClear} onClick={() => setSearch('')}><Icon.X /></button>}
                </div>

                {/* Sort */}
                <div className={styles.sortWrap}>
                  <Icon.Sort />
                  <select
                    className={styles.sortSelect}
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value="modified">Modificado</option>
                    <option value="name">Nome</option>
                    <option value="size">Tamanho</option>
                  </select>
                </div>

                {/* View toggle */}
                <div className={styles.viewToggle}>
                  <button className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`} onClick={() => setView('grid')} title="Grade"><Icon.Grid /></button>
                  <button className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setView('list')} title="Lista"><Icon.List /></button>
                </div>

                <div className={styles.topBarDivider} />

                {/* New folder */}
                <button className={styles.newFolderBtn} onClick={handleNewFolder}>
                  <Icon.NewFolder />
                  Nova pasta
                </button>

                {/* Upload */}
                <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                  <Icon.Upload />
                  Enviar
                </button>
              </>
            )}
            <input ref={fileInputRef} type="file" multiple className={styles.hiddenInput} onChange={handleFileInput} />
          </div>
        </header>

        {/* Content area */}
        <div
          className={`${styles.content} ${detailItem ? styles.contentWithPanel : ''}`}
          onClick={handleCanvasBackground}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false) }}
          onDrop={handleDrop}
        >
          {/* Drop overlay */}
          {dragOver && (
            <div className={styles.dropOverlay}>
              <div className={styles.dropOverlayInner}>
                <Icon.CloudUp />
                <p>Solte os arquivos para enviar</p>
              </div>
            </div>
          )}

          {/* Files area */}
          <div className={styles.filesArea}>
            <div className={styles.filesAreaHeader}>
              <p className={styles.filesAreaKicker}>
                {breadcrumb.length ? breadcrumb[breadcrumb.length - 1].name : sectionLabel}
              </p>
              <div className={styles.filesAreaMeta}>
                <span>{filteredFiles.length} {filteredFiles.length === 1 ? 'item' : 'itens'}</span>
                <span className={styles.filesAreaDot} />
                <span>Sincronizado agora</span>
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}><EmptyIcon /></span>
                <p className={styles.emptyTitle}>{emptyState.title}</p>
                <p className={styles.emptyHint}>{emptyState.hint}</p>
                {emptyState.action && (
                  <button className={styles.emptyUploadBtn} onClick={emptyState.onAction}>
                    {emptyState.action === 'Enviar arquivos' && <Icon.Upload />}
                    {emptyState.action}
                  </button>
                )}
              </div>
            ) : view === 'grid' ? (
              <div className={styles.fileGrid}>
                {filteredFiles.map(item => (
                  <FileCard
                    key={item.id}
                    item={item}
                    selected={selected === item.id}
                    onSelect={id => {
                      setSelected(id)
                      const f = filteredFiles.find(x => x.id === id)
                      if (f) setDetailItemId(f.id)
                    }}
                    onOpen={openItem}
                    onContextMenu={(e, item) => setContextMenu({ x: e.clientX, y: e.clientY, item })}
                    onToggleStar={toggleStar}
                    renamingId={renamingId}
                    onRename={handleRename}
                    onRenameCancel={() => setRenamingId(null)}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.fileList}>
                <div className={styles.fileListHeader}>
                  <span className={styles.fileListHdrName}>Nome</span>
                  <span className={styles.fileListHdrOwner}>Dono</span>
                  <span className={styles.fileListHdrDate}>Modificado</span>
                  <span className={styles.fileListHdrSize}>Tamanho</span>
                  <span className={styles.fileListHdrActions} />
                </div>
                {filteredFiles.map(item => (
                  <FileRow
                    key={item.id}
                    item={item}
                    selected={selected === item.id}
                    onSelect={id => {
                      setSelected(id)
                      const f = filteredFiles.find(x => x.id === id)
                      if (f) setDetailItemId(f.id)
                    }}
                    onOpen={openItem}
                    onContextMenu={(e, item) => setContextMenu({ x: e.clientX, y: e.clientY, item })}
                    onToggleStar={toggleStar}
                    renamingId={renamingId}
                    onRename={handleRename}
                    onRenameCancel={() => setRenamingId(null)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {detailItem && (
            <DetailPanel
              item={detailItem}
              onClose={() => { setDetailItemId(null); setSelected(null) }}
              onToggleStar={toggleStar}
              onAction={handleContextAction}
            />
          )}
        </div>
      </ProductAppShell>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Upload toast */}
      <UploadToast uploads={uploads} onDismiss={dismissUpload} />

      {/* Notification toast */}
      {notification && (
        <div className={styles.notification}>
          {notification}
        </div>
      )}
    </>
  )
}
