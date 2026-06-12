import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import { apiRequest, triggerBlobDownload } from '../../../../shared/api/apiClient.js'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import WorkspaceHeader from '../../../../shared/components/WorkspaceHeader/WorkspaceHeader.jsx'
import AuthenticatedAvatar from '../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx'
import CardModal from '../../components/CardModal/CardModal.jsx'
import AddColumnComposer from '../../components/AddColumnComposer/AddColumnComposer.jsx'
import BoardHeader from '../../components/BoardHeader/BoardHeader.jsx'
import KanbanColumn from '../../components/KanbanColumn/KanbanColumn.jsx'
import { usePlans } from '../../context/PlansContext.jsx'
import { useBoardColumns } from '../../hooks/useBoardColumns.js'
import { useBoardDragAndDrop } from '../../hooks/useBoardDragAndDrop.js'
import { useResolvedPlanRoute } from '../../hooks/useResolvedPlanRoute.js'
import { useCalendarEvents } from '../../../calendar/hooks/useCalendarEvents.js'
import { CalendarWorkspaceView } from '../../../calendar/pages/CalendarPage/CalendarPage.jsx'
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import { getFileTypeFromName } from '../../../files/data/libraryRepository.js'
import { buildPlannerView, filterPlannerItems } from './plannerFilters.js'
import {
  KANBAN_COLUMN_COLOR_OPTIONS,
  KANBAN_DEFAULT_LABELS,
  resolveKanbanAccentColor,
  resolveKanbanAccentForeground,
} from '../../data/kanbanColorPalette.js'
import IntelligenceComposer from '../../../../shared/components/IntelligenceComposer/IntelligenceComposer.jsx'
import IntelligenceConversationThread from '../../../intelligence/components/IntelligenceConversationThread/IntelligenceConversationThread.jsx'
import { useIntelligenceComposerContext } from '../../../intelligence/hooks/useIntelligenceComposerContext.js'
import { useAiConversation } from '../../../intelligence/hooks/useAiConversation.js'
import styles from './KanbanBoard.module.css'

/* ═══════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════ */
const Icon = {
  Home:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 15V9h4v6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Popover:  () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2.5H2.5v7H9.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 7L9.5 2.5M7 2.5h2.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Files:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8A1.5 1.5 0 0 0 13.5 13V6L9 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V6H13.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Library:  () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2.4 5.1A1.6 1.6 0 0 1 4 3.5h2.1l1.1 1.2H12a1.6 1.6 0 0 1 1.6 1.6v4.6A1.6 1.6 0 0 1 12 12.5H4a1.6 1.6 0 0 1-1.6-1.6V5.1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M2.8 6.3h10.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v7M4.5 6.5L7 9l2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10v1.5A1.5 1.5 0 0 0 3.5 13h7a1.5 1.5 0 0 0 1.5-1.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Plus:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Users:    () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 14c0-2.4 2-4.3 4.5-4.3S10.5 11.6 10.5 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11.2 7.6a2.4 2.4 0 1 0 0-4.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 9.9c1.9.3 3.5 1.9 3.5 4.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  X:        () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  Collapse: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L5 7l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  More:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="7" r="1" fill="currentColor"/><circle cx="11" cy="7" r="1" fill="currentColor"/></svg>,
  Check:    () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Edit:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Trash:    () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 8h6.4L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Tag:      () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2h5l5 5-5 5-5-5V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><circle cx="4.5" cy="4.5" r="1" fill="currentColor"/></svg>,
  User:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Clock:    () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Send:     () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M12 2L2 6.5l4 1.5 1.5 4L12 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Filter:   () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Share:    () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4.4 7.8L9.7 10M9.7 4L4.4 6.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  Logo:     () => <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".35"/><rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55"/><rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75"/></svg>,
  Chevron:  () => <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Board:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="4" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="6" y="3" width="4" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="3" width="4" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
  Inbox:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 3h10v10H3V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M3 9h3l1.2 2h1.6L10 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Calendar: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1.8v2.8M11 1.8v2.8M2.5 6.5h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Switch:   () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 2.5h7A1.5 1.5 0 0 1 13.5 4v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Lock:     () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.3"/><path d="M4.8 6V4.4a2.2 2.2 0 1 1 4.4 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Comment:  () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M12 7A5 5 0 0 1 4 11.5L1.5 12.5l1-2.5A5 5 0 1 1 12 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  Priority: () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v6M7 10.5v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  List:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M5 5h8M5 10.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="2.5" cy="5" r=".9" fill="currentColor"/><circle cx="2.5" cy="10.5" r=".9" fill="currentColor"/></svg>,
  Link:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.4 9.6L9.6 6.4M6 11.5H4.8A2.8 2.8 0 1 1 4.8 5.9H6M10 4.5h1.2a2.8 2.8 0 1 1 0 5.6H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Plug:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 2.5v3M10 2.5v3M5.2 5.5h5.6v1.8a2.8 2.8 0 0 1-2.8 2.8h-.2a2.8 2.8 0 0 1-2.8-2.8V5.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10.1v3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Bolt:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M9.1 1.8L4.8 8h2.9L6.9 14.2 11.2 8H8.3l.8-6.2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Globe:    () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.7" stroke="currentColor" strokeWidth="1.3"/><path d="M2.7 6.1h10.6M2.7 9.9h10.6M8 2.4c1.6 1.6 2.5 3.5 2.5 5.6S9.6 12 8 13.6M8 2.4C6.4 4 5.5 5.9 5.5 8s.9 4 2.5 5.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Mic:      () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="5.2" y="2.2" width="5.6" height="8" rx="2.8" stroke="currentColor" strokeWidth="1.3"/><path d="M3.8 7.8a4.2 4.2 0 0 0 8.4 0M8 12v1.8M5.8 13.8h4.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ArrowUp:  () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 11V3M3.8 6.2L7 3l3.2 3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  UserPlus: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.2" cy="5.4" r="2.3" stroke="currentColor" strokeWidth="1.3"/><path d="M2.4 12.4c0-2 1.8-3.6 3.8-3.6 2.1 0 3.9 1.6 3.9 3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11.7 4.2v4M9.7 6.2h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  Image:    () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 10l2.1-2.2a.8.8 0 0 1 1.2 0l1.7 1.8 1.3-1.3a.8.8 0 0 1 1.1 0L13.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="6" r="1" fill="currentColor"/></svg>,
  Code:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 5L3 8l3 3M10 5l3 3-3 3M8.8 3.5L7.2 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Star:     () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L8 11.1 4.5 12.9l.7-3.9L2.4 6.3l3.9-.6L8 2.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  StarFill: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2.2l1.7 3.5 3.9.6-2.8 2.7.7 3.9L8 11.1 4.5 12.9l.7-3.9L2.4 6.3l3.9-.6L8 2.2z" fill="currentColor"/></svg>,
  CheckCircle: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.3"/><path d="M5.3 8.3l1.6 1.6 3.7-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Sun: () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
}

const IntelligencePluginLogo = {
  GitHub: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.4a6.6 6.6 0 0 0-2.1 12.85c.33.06.45-.14.45-.32v-1.2c-1.82.4-2.2-.77-2.2-.77-.3-.74-.73-.94-.73-.94-.6-.41.05-.4.05-.4.66.05 1 .67 1 .67.6 1 .15.52 1.5.4.05-.43.23-.73.42-.89-1.45-.16-2.98-.72-2.98-3.22 0-.71.25-1.3.67-1.75-.07-.16-.29-.82.06-1.7 0 0 .55-.18 1.8.67a6.26 6.26 0 0 1 3.28 0c1.24-.85 1.79-.67 1.79-.67.35.88.13 1.54.06 1.7.42.45.67 1.04.67 1.75 0 2.5-1.53 3.06-2.99 3.22.24.2.45.61.45 1.24v1.84c0 .18.12.38.46.31A6.6 6.6 0 0 0 8 1.4Z"
        fill="currentColor"
      />
    </svg>
  ),
  Teams: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="4" width="6.5" height="8" rx="1.6" fill="#4F52D9" />
      <rect x="8.3" y="5.1" width="5.7" height="7.4" rx="1.8" fill="#7B83EB" />
      <circle cx="11.15" cy="3.95" r="1.95" fill="#6264F5" />
      <circle cx="13.1" cy="6" r="1.4" fill="#8B8CC7" />
      <path d="M3.25 6.1h3.2v1.1H5.45v4.1h-1.2V7.2H3.25V6.1Z" fill="white" />
    </svg>
  ),
  Slack: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  ),
}

/* ═══════════════════════════════════════════════════════════════
   INITIAL DATA
═══════════════════════════════════════════════════════════════ */
const MEMBERS = [
  { id: 'm1', initials: 'AS', color: '#000'    },
  { id: 'm2', initials: 'MK', color: '#d4aef1' },
  { id: 'm3', initials: 'TK', color: '#4290da' },
  { id: 'm4', initials: 'SR', color: '#0f703a' },
]

const CALENDAR_DAYS = [
  { label: 29, muted: true }, { label: 30, muted: true }, { label: 31, muted: true }, { label: 1 }, { label: 2 }, { label: 3 }, { label: 4 },
  { label: 5 }, { label: 6, underline: true }, { label: 7, selected: true }, { label: 8 }, { label: 9 }, { label: 10 }, { label: 11 },
  { label: 12 }, { label: 13 }, { label: 14 }, { label: 15 }, { label: 16 }, { label: 17 }, { label: 18 },
  { label: 19 }, { label: 20 }, { label: 21 }, { label: 22 }, { label: 23 }, { label: 24 }, { label: 25 },
  { label: 26 }, { label: 27 }, { label: 28 }, { label: 29 }, { label: 30 }, { label: 1, muted: true }, { label: 2, muted: true },
  { label: 3, muted: true }, { label: 4, muted: true }, { label: 5, muted: true }, { label: 6, muted: true }, { label: 7, muted: true }, { label: 8, muted: true }, { label: 9, muted: true },
]

const INTELLIGENCE_PLUGIN_OPTIONS = [
  {
    id: 'github',
    label: 'GitHub',
    Logo: IntelligencePluginLogo.GitHub,
  },
  {
    id: 'teams',
    label: 'Teams',
    Logo: IntelligencePluginLogo.Teams,
  },
  {
    id: 'slack',
    label: 'Slack',
    Logo: IntelligencePluginLogo.Slack,
  },
]

const uid = () => Math.random().toString(36).slice(2, 9)

function mapApiFileItem(item) {
  return {
    id: item.id,
    name: item.name,
    type: item.type === 'FOLDER' ? 'folder' : getFileTypeFromName(item.name),
    mimeType: item.mimeType ?? '',
    size: item.sizeBytes ?? 0,
    modified: item.updatedAt?.text ?? item.createdAt?.text ?? 'Agora',
    sharedByCurrentUser: Boolean(item.sharedByCurrentUser),
    canUnshare: Boolean(item.canUnshare),
  }
}

function mapApiAttachmentItem(item) {
  return {
    id: item.id,
    fileId: item.fileId,
    name: item.name,
    type: item.type === 'FOLDER' ? 'folder' : getFileTypeFromName(item.name),
    mimeType: item.mimeType ?? '',
    size: item.sizeBytes ?? 0,
    attachedBy: item.attachedBy ?? null,
    attachedByCurrentUser: Boolean(item.attachedByCurrentUser),
    canRemove: Boolean(item.canRemove),
    createdAt: item.createdAt ?? null,
  }
}

function mapAttachmentToFileItem(attachment) {
  return {
    id: attachment.fileId,
    name: attachment.name,
    type: attachment.type,
    mimeType: attachment.mimeType ?? '',
    size: attachment.size ?? 0,
    modified: attachment.createdAt?.text ?? 'Agora',
    sharedByCurrentUser: true,
    canUnshare: true,
  }
}

function upsertFileItem(items, nextItem) {
  if (!Array.isArray(items) || !nextItem?.id) {
    return items
  }

  const existingIndex = items.findIndex((item) => item.id === nextItem.id)
  if (existingIndex < 0) {
    return [...items, nextItem]
  }

  const currentItem = items[existingIndex]
  const mergedItem = { ...currentItem, ...nextItem }
  const hasChanges = Object.keys(mergedItem).some((key) => mergedItem[key] !== currentItem[key])
  if (!hasChanges) {
    return items
  }

  const nextItems = [...items]
  nextItems[existingIndex] = mergedItem
  return nextItems
}

function appendAttachmentToColumns(columns, cardId, nextAttachment) {
  if (!Array.isArray(columns) || !cardId || !nextAttachment?.id) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false
    const nextCards = column.cards.map((card) => {
      if (card.id !== cardId) {
        return card
      }

      const currentAttachments = Array.isArray(card.attachments) ? card.attachments : []
      const existingIndex = currentAttachments.findIndex((attachment) => (
        attachment.id === nextAttachment.id || attachment.fileId === nextAttachment.fileId
      ))
      const nextAttachments = existingIndex >= 0
        ? currentAttachments.map((attachment, index) => (
            index === existingIndex ? { ...attachment, ...nextAttachment } : attachment
          ))
        : [...currentAttachments, nextAttachment]

      const attachmentsChanged = nextAttachments.length !== currentAttachments.length
        || nextAttachments.some((attachment, index) => attachment !== currentAttachments[index])

      if (!attachmentsChanged) {
        return card
      }

      columnChanged = true
      hasChanges = true
      return {
        ...card,
        attachments: nextAttachments,
      }
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

function removeAttachmentFromColumns(columns, attachmentId) {
  if (!Array.isArray(columns) || !attachmentId) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    let columnChanged = false
    const nextCards = column.cards.map((card) => {
      const currentAttachments = Array.isArray(card.attachments) ? card.attachments : []
      const nextAttachments = currentAttachments.filter((attachment) => attachment.id !== attachmentId)
      if (nextAttachments.length === currentAttachments.length) {
        return card
      }

      columnChanged = true
      hasChanges = true
      return {
        ...card,
        attachments: nextAttachments,
      }
    })

    return columnChanged ? { ...column, cards: nextCards } : column
  })

  return hasChanges ? nextColumns : columns
}

function insertCardInOrder(cards, nextCard) {
  const cardsWithoutCurrent = cards.filter((card) => card.id !== nextCard.id)
  const rawPosition = nextCard.position

  if (!Number.isFinite(rawPosition)) {
    return [...cardsWithoutCurrent, nextCard]
  }

  const insertionIndex = Math.max(0, Math.min(rawPosition, cardsWithoutCurrent.length))
  return [
    ...cardsWithoutCurrent.slice(0, insertionIndex),
    nextCard,
    ...cardsWithoutCurrent.slice(insertionIndex),
  ]
}

function replaceCardInColumns(columns, nextCard) {
  if (!Array.isArray(columns) || !nextCard?.id) {
    return columns
  }

  const inferredColumnId = nextCard.columnId
    ?? columns.find((column) => column.cards.some((card) => card.id === nextCard.id))?.id
  if (!inferredColumnId) {
    return columns
  }

  const cardForColumns = nextCard.columnId === inferredColumnId
    ? nextCard
    : { ...nextCard, columnId: inferredColumnId }
  const hasTargetColumn = columns.some((column) => column.id === inferredColumnId)
  if (!hasTargetColumn) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    const hasCard = column.cards.some((card) => card.id === nextCard.id)

    if (column.id === inferredColumnId) {
      const nextCards = hasCard
        ? column.cards.map((card) => (card.id === cardForColumns.id ? cardForColumns : card))
        : insertCardInOrder(column.cards, cardForColumns)
      const cardsChanged = nextCards.length !== column.cards.length
        || nextCards.some((card, index) => card !== column.cards[index])

      if (!cardsChanged) {
        return column
      }

      hasChanges = true
      return {
        ...column,
        cards: nextCards,
      }
    }

    if (!hasCard) {
      return column
    }

    hasChanges = true
    return {
      ...column,
      cards: column.cards.filter((card) => card.id !== nextCard.id),
    }
  })

  return hasChanges ? nextColumns : columns
}

function removeCardFromColumns(columns, cardId) {
  if (!Array.isArray(columns) || !cardId) {
    return columns
  }

  let hasChanges = false

  const nextColumns = columns.map((column) => {
    const nextCards = column.cards.filter((card) => card.id !== cardId)
    if (nextCards.length === column.cards.length) {
      return column
    }

    hasChanges = true
    return {
      ...column,
      cards: nextCards,
    }
  })

  return hasChanges ? nextColumns : columns
}

function findCardInColumns(columns, cardId) {
  if (!Array.isArray(columns) || !cardId) {
    return null
  }

  return columns.flatMap((column) => column.cards).find((card) => card.id === cardId) ?? null
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function describeInboxError(error) {
  const messageByCode = {
    CARTAO_SEM_DESTINATARIOS: 'Escolha ao menos um membro para receber este cartão por e-mail.',
    DESTINATARIO_INVALIDO: 'Todos os destinatários precisam fazer parte deste plano.',
    GMAIL_NAO_CONECTADO: 'Gmail não conectado para este usuário. Conecte o Gmail em Configurações e tente novamente.',
    GMAIL_SCOPE_AUSENTE: 'A conexão Gmail não tem permissão de envio. Reconecte o Gmail em Configurações.',
    GMAIL_TOKEN_REFRESH_FALHOU: 'Não foi possível renovar a autorização Gmail. Reconecte o Gmail em Configurações.',
    GMAIL_ENVIO_CONVITE_FALHOU: 'O Gmail recusou o envio do e-mail. Verifique a conta conectada e tente novamente.',
    GMAIL_API_NAO_HABILITADA: 'A API do Gmail não está habilitada no projeto Google Cloud. Habilite Gmail API e tente novamente.',
  }

  if (!messageByCode[error?.code]) {
    return error?.message ?? 'Não foi possível enviar o cartão por e-mail.'
  }

  return `${messageByCode[error.code]} Código: ${error.code}.`
}

function dateKeyFromTimeZoneInstant(value, timeZone) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const partByType = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date).map((part) => [part.type, part.value]))

  const year = partByType.year
  const month = partByType.month
  const day = partByType.day

  if (!year || !month || !day) return null
  return `${year}-${month}-${day}`
}

function timeValueFromIsoInTimeZone(iso, timeZone) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const partByType = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date).map((part) => [part.type, part.value]))

  const hour = partByType.hour
  const minute = partByType.minute
  if (!hour || !minute) return null
  return `${hour}:${minute}`
}

function timeValueMinutes(value) {
  if (!value) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function addDaysToDateKey(dateKeyValue, days) {
  if (!dateKeyValue) return null
  const [year, month, day] = dateKeyValue.split('-').map(Number)
  if (![year, month, day].every(Number.isFinite)) return null
  const utc = Date.UTC(year, month - 1, day + days, 12, 0, 0, 0)
  const date = new Date(utc)
  return dateKey(date)
}

function BoardLoadingState({ styles }) {
  return (
    <div className={styles.board} aria-hidden="true">
      {Array.from({ length: 4 }, (_, columnIndex) => (
        <div key={`board-loading-${columnIndex}`} className={styles.boardLoadingColumn}>
          <div className={styles.boardLoadingColumnHeader}>
            <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingColumnTitle}`} />
            <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingColumnMeta}`} />
          </div>
          <div className={styles.boardLoadingCards}>
            {Array.from({ length: 3 }, (_, cardIndex) => (
              <div key={`board-loading-${columnIndex}-${cardIndex}`} className={styles.boardLoadingCard}>
                <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingCardTitle}`} />
                <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingCardText}`} />
                <span className={`${styles.boardLoadingBlock} ${styles.boardLoadingCardTextShort}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CARD DETAIL MODAL
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   MAIN BOARD
═══════════════════════════════════════════════════════════════ */
export default function KanbanBoard() {
  const { planId } = useParams()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { accessToken, currentUser } = useAuth()
  const {
    updatePlanBoard,
    isBackendDriven,
    loadPlanBoard,
    applyBoardView,
    ensurePlanDetails,
    isLoading,
  } = usePlans()
  const { plans, activePlan, openPlan } = useResolvedPlanRoute({
    planId,
    buildPath: buildWorkspaceBoardPath,
  })
  const [boardViewMode, setBoardViewMode] = useState(() => {
    if (location.state?.boardViewMode === 'calendar') return 'calendar'
    return 'kanban'
  })
  const [activeCard,setActiveCard]= useState(null)   // { card, colTitle }
  const [addingCol, setAddingCol] = useState(false)
  const [newColTitle,setNewColTitle] = useState('')
  const [addColumnError, setAddColumnError] = useState(null)
  const [boardLoadError, setBoardLoadError] = useState(null)
  const [notification, setNotification] = useState(null)
  const [isInboxOpen, setIsInboxOpen] = useState(false)
  const [isInboxPanelMounted, setIsInboxPanelMounted] = useState(false)
  const [isInboxDropActive, setIsInboxDropActive] = useState(false)
  const [inboxRecipientCard, setInboxRecipientCard] = useState(null)
  const [inboxSelectedMemberIds, setInboxSelectedMemberIds] = useState([])
  const [inboxSendingCardId, setInboxSendingCardId] = useState('')
  const [inboxError, setInboxError] = useState('')
  const [inboxItems, setInboxItems] = useState([])
  const [isClearingInbox, setIsClearingInbox] = useState(false)
  const [isPlannerOpen, setIsPlannerOpen] = useState(false)
  const [isPlannerPanelMounted, setIsPlannerPanelMounted] = useState(false)
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false)
  const [isIntelligencePanelMounted, setIsIntelligencePanelMounted] = useState(false)
  const [intelligenceDraft, setIntelligenceDraft] = useState('')
  const [kanbanAiChips, setKanbanAiChips] = useState([])
  const intelligenceActiveConnectors = kanbanAiChips.filter((c) => c.kind === 'connector').map((c) => c.type)
  const {
    messages: intelligenceMessages,
    isThinking: isIntelligenceThinking,
    hasConversation: hasIntelligenceConversation,
    submitMessage: submitIntelligenceMessage,
    canSubmitWith: canSubmitIntelligenceMessage,
  } = useAiConversation({
    accessToken,
    enabled: isIntelligenceOpen || isIntelligencePanelMounted,
    scope: {
      planId: activePlan?.id ?? null,
      planName: activePlan?.name ?? null,
    },
    aiChips: kanbanAiChips,
    setAiChips: setKanbanAiChips,
  })
  const [toolbarMetrics, setToolbarMetrics] = useState({ left: null, width: 0, height: 44, bottom: 24 })
  const [planFiles, setPlanFiles] = useState([])
  const [libraryFiles, setLibraryFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState(null)
  const [isPlannerFilterOpen, setIsPlannerFilterOpen] = useState(false)
  const [plannerFilter, setPlannerFilter] = useState('my-day')
  const plannerFilterWrapRef = useRef(null)
  const [plannerPinnedById, setPlannerPinnedById] = useState({})
  const { generalPreferences, localPreferences, formatClockTime } = usePreferences()
  const timeZone = generalPreferences.timezone
  const dateFormat = generalPreferences.dateFormat
  const boardAccentColor = resolveKanbanAccentColor(localPreferences?.kanbanAccentColor)
  const boardAccentForeground = resolveKanbanAccentForeground(localPreferences?.kanbanAccentColor)
  const boardAccentStyle = useMemo(() => ({
    '--kanban-accent-color': boardAccentColor,
    '--kanban-accent-foreground': boardAccentForeground,
  }), [boardAccentColor, boardAccentForeground])
  const today = useMemo(() => new Date(), [timeZone])
  const notificationTimerRef = useRef(null)
  const inboxCloseTimerRef = useRef(null)
  const plannerCloseTimerRef = useRef(null)
  const intelligenceCloseTimerRef = useRef(null)
  const boardViewToolbarRef = useRef(null)
  const intelligencePanelRef = useRef(null)
  const intelligenceComposerInputRef = useRef(null)
  const { filteredEvents: plannerCalendarEvents } = useCalendarEvents({
    enabled: isPlannerPanelMounted,
    includeGeneratedFromCard: false,
    enrichGeneratedCardKinds: false,
  })
  const planLabels = activePlan?.labelsMeta?.length ? activePlan.labelsMeta : KANBAN_DEFAULT_LABELS
  const isPlanMembersLoading = Boolean(isBackendDriven && activePlan?.id && !activePlan.detailsLoaded)
  const backendPlanMembers = Array.isArray(activePlan?.membersMeta) ? activePlan.membersMeta : []
  const planMembers = isBackendDriven
    ? backendPlanMembers
    : (activePlan ? (activePlan?.membersMeta?.length ? activePlan.membersMeta : MEMBERS) : [])
  const inboxAssignedMemberIds = new Set(inboxRecipientCard?.memberIds ?? [])
  const inboxSelectableMembers = planMembers.length
    ? planMembers.filter((member) => !inboxAssignedMemberIds.has(member.id))
    : []

  useEffect(() => {
    const toolbar = boardViewToolbarRef.current
    if (!toolbar || typeof window === 'undefined') return undefined

    const updateToolbarMetrics = () => {
      const rect = toolbar.getBoundingClientRect()
      const computedStyles = window.getComputedStyle(toolbar)
      const nextMetrics = {
        left: Math.round(rect.left + (rect.width / 2)),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        bottom: Math.round(Number.parseFloat(computedStyles.bottom) || 24),
      }

      setToolbarMetrics((current) => (
        current.left === nextMetrics.left
        && current.width === nextMetrics.width
        && current.height === nextMetrics.height
        && current.bottom === nextMetrics.bottom
          ? current
          : nextMetrics
      ))
    }

    updateToolbarMetrics()

    const resizeHandler = () => updateToolbarMetrics()
    window.addEventListener('resize', resizeHandler)

    let observer = null
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(() => updateToolbarMetrics())
      observer.observe(toolbar)
    }

    return () => {
      window.removeEventListener('resize', resizeHandler)
      observer?.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!isIntelligencePanelMounted) return undefined

    const closePanel = () => {
      setIsIntelligenceOpen(false)
      if (intelligenceCloseTimerRef.current) {
        clearTimeout(intelligenceCloseTimerRef.current)
      }
      intelligenceCloseTimerRef.current = setTimeout(() => {
        setIsIntelligencePanelMounted(false)
        intelligenceCloseTimerRef.current = null
      }, 260)
    }

    const handleMouseDown = (event) => {
      const panel = intelligencePanelRef.current
      const toolbar = boardViewToolbarRef.current
      if (panel?.contains(event.target) || toolbar?.contains(event.target)) {
        return
      }
      closePanel()
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      closePanel()
    }

    document.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isIntelligencePanelMounted])

  const {
    columns,
    totalCards,
    updateColumns,
    createColumn,
    deleteColumn,
    renameColumn,
    changeColColor,
    addCard,
    updateCard,
    deleteCard,
    addCardComment,
    moveCard,
    createChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
  } = useBoardColumns({
    activePlanId: activePlan?.id,
    boardColumns: activePlan?.boardColumns,
    updatePlanBoard,
    isBackendDriven,
    accessToken,
    applyBoardView,
    loadPlanBoard,
    timeZone,
    dateFormat,
  })
  const composerContext = useIntelligenceComposerContext({
    scope: 'board',
    boardColumns: columns,
  })
  const {
    dragState,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  } = useBoardDragAndDrop({
    activePlanId: activePlan?.id,
    columns,
    updateColumns,
    moveCard,
    isBackendDriven,
    onMoveError: (error) => showNotification(error?.message ?? 'Não foi possível mover o cartão.'),
  })

  const addColumn = async () => {
    const nextTitle = newColTitle.trim()
    if (!nextTitle) return

    setNewColTitle('')
    setAddingCol(false)
    setAddColumnError(null)

    try {
      await createColumn(nextTitle)
    } catch (error) {
      const message = error?.message ?? 'Não foi possível criar a lista.'
      setNewColTitle(nextTitle)
      setAddingCol(true)
      setAddColumnError(message)
      showNotification(message)
    }
  }

  const saveCardOptimistically = useCallback(async (nextCard) => {
    if (!nextCard?.id) {
      return updateCard(nextCard)
    }

    const previousColumns = columns
    const previousCard = findCardInColumns(previousColumns, nextCard.id)

    updateColumns((currentColumns) => replaceCardInColumns(currentColumns, nextCard))
    setActiveCard((current) => (
      current?.card?.id === nextCard.id
        ? { ...current, card: nextCard }
        : current
    ))

    try {
      const persistedCard = await updateCard(nextCard)
      if (persistedCard) {
        setActiveCard((current) => (
          current?.card?.id === persistedCard.id
            ? { ...current, card: persistedCard }
            : current
        ))
      }
      return persistedCard ?? nextCard
    } catch (error) {
      updateColumns(() => previousColumns)
      setActiveCard((current) => {
        if (current?.card?.id !== nextCard.id) {
          return current
        }

        return previousCard
          ? { ...current, card: previousCard }
          : current
      })
      throw error
    }
  }, [columns, updateCard, updateColumns])

  const handleCardUpdate = async (updatedCard) => {
    return saveCardOptimistically(updatedCard)
  }

  const handleCardDelete = async (cardId) => {
    const previousActiveCard = activeCard
    setActiveCard(null)

    try {
      await deleteCard(cardId)
    } catch (error) {
      setActiveCard(previousActiveCard ?? null)
      showNotification(error?.message ?? 'Não foi possível excluir o cartão.')
      throw error
    }
  }

  const handleBoardCardClick = useCallback((card, colTitle) => {
    setActiveCard({ card, colTitle })
  }, [])

  useEffect(() => {
    const cardIdFromUrl = String(searchParams.get('card') ?? '').trim()
    if (!cardIdFromUrl || !columns.length) return

    for (const column of columns) {
      const card = column.cards?.find((item) => item.id === cardIdFromUrl)
      if (card) {
        setActiveCard({ card, colTitle: column.title })
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete('card')
        setSearchParams(nextParams, { replace: true })
        break
      }
    }
  }, [columns, searchParams, setSearchParams])

  useEffect(() => {
    setBoardLoadError(null)
    if (!activePlan?.id || !isBackendDriven) return

    loadPlanBoard(activePlan.id).catch((error) => {
      setBoardLoadError(error?.message ?? 'Não foi possível carregar o quadro deste plano.')
    })
  }, [activePlan?.id, isBackendDriven, loadPlanBoard])

  const retryLoadBoard = async () => {
    if (!activePlan?.id || !isBackendDriven) return

    setBoardLoadError(null)
    try {
      await loadPlanBoard(activePlan.id)
    } catch (error) {
      setBoardLoadError(error?.message ?? 'Não foi possível carregar o quadro deste plano.')
    }
  }

  const showNotification = (message) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
    setNotification(message)
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null)
      notificationTimerRef.current = null
    }, 2600)
  }

  const handleColumnDelete = async (colId) => {
    try {
      await deleteColumn(colId)
    } catch (error) {
      showNotification(error?.message ?? 'Não foi possível excluir a lista.')
    }
  }

  const handleColumnColorChange = (colId, color) => {
    changeColColor(colId, color).catch((error) => {
      showNotification(error?.message ?? 'Não foi possível alterar a cor da lista.')
    })
  }

  const reloadFileLists = async () => {
    if (!activePlan?.id || !isBackendDriven) {
      setPlanFiles([])
      setLibraryFiles([])
      setFilesError(null)
      return { plan: [], library: [] }
    }

    setFilesLoading(true)
    setFilesError(null)

    try {
      const [planItems, libraryItems] = await Promise.all([
        apiRequest(`/api/files/plans/${activePlan.id}`, {
          token: accessToken,
        }),
        apiRequest('/api/files', {
          token: accessToken,
        }),
      ])
      const nextPlanFiles = planItems.map(mapApiFileItem).filter((file) => file.type !== 'folder')
      const nextLibraryFiles = libraryItems.map(mapApiFileItem).filter((file) => file.type !== 'folder')
      setPlanFiles(nextPlanFiles)
      setLibraryFiles(nextLibraryFiles)
      return { plan: nextPlanFiles, library: nextLibraryFiles }
    } catch (error) {
      const message = error?.message ?? 'Não foi possível carregar os arquivos.'
      setFilesError(message)
      showNotification(message)
      return { plan: [], library: [] }
    } finally {
      setFilesLoading(false)
    }
  }

  const refreshActiveCardFromColumns = (nextColumns, cardId) => {
    const nextCard = nextColumns.flatMap((column) => column.cards).find((card) => card.id === cardId)
    if (nextCard) {
      setActiveCard((current) => (
        current?.card?.id === cardId ? { ...current, card: nextCard } : current
      ))
    }
    return nextCard
  }

  const attachFileToCard = async (file, cardId) => {
    if (!activePlan?.id || !isBackendDriven) return null

    const createdAttachment = mapApiAttachmentItem(await apiRequest(`/api/files/${file.id}/attach/cards/${cardId}`, {
      method: 'POST',
      token: accessToken,
    }))
    let nextColumns = columns
    updateColumns((prev) => {
      nextColumns = appendAttachmentToColumns(prev, cardId, createdAttachment)
      return nextColumns
    })
    setPlanFiles((current) => upsertFileItem(current, {
      ...file,
      sharedByCurrentUser: true,
      canUnshare: true,
    }))
    setLibraryFiles((current) => upsertFileItem(current, {
      ...file,
      sharedByCurrentUser: true,
      canUnshare: true,
    }))
    showNotification(`"${file.name}" anexado ao cartão.`)
    return refreshActiveCardFromColumns(nextColumns, cardId)
  }

  const uploadLocalFileToCard = async (localFile, cardId) => {
    if (!activePlan?.id || !isBackendDriven || !(localFile instanceof File)) return null

    const formData = new FormData()
    formData.append('file', localFile)

    const createdAttachment = mapApiAttachmentItem(await apiRequest(`/api/files/upload/attach/cards/${cardId}`, {
      method: 'POST',
      token: accessToken,
      body: formData,
    }))
    const createdFile = mapAttachmentToFileItem(createdAttachment)
    let nextColumns = columns
    updateColumns((prev) => {
      nextColumns = appendAttachmentToColumns(prev, cardId, createdAttachment)
      return nextColumns
    })
    setPlanFiles((current) => upsertFileItem(current, createdFile))
    setLibraryFiles((current) => upsertFileItem(current, createdFile))
    showNotification(`"${localFile.name}" enviado para a Biblioteca e anexado ao cartão.`)
    return refreshActiveCardFromColumns(nextColumns, cardId)
  }

  const removeAttachmentFromCard = async (attachment) => {
    if (!activePlan?.id || !isBackendDriven) return null

    await apiRequest(`/api/files/attachments/${attachment.id}`, {
      method: 'DELETE',
      token: accessToken,
    })
    let nextColumns = columns
    updateColumns((prev) => {
      nextColumns = removeAttachmentFromColumns(prev, attachment.id)
      return nextColumns
    })
    showNotification(`"${attachment.name}" removido do cartão.`)
    return refreshActiveCardFromColumns(nextColumns, activeCard?.card?.id)
  }

  const downloadFile = async (file) => {
    if (!isBackendDriven) {
      showNotification(`Baixando "${file.name}"...`)
      return
    }

    const blob = await apiRequest(`/api/files/${file.fileId ?? file.id}/download`, {
      token: accessToken,
      responseType: 'blob',
    })
    triggerBlobDownload(blob, file.name)
    showNotification(`"${file.name}" baixado.`)
  }

  const openPlanner = () => {
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
      plannerCloseTimerRef.current = null
    }
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
      inboxCloseTimerRef.current = null
    }
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
      intelligenceCloseTimerRef.current = null
    }
    setIsInboxOpen(false)
    setIsInboxPanelMounted(false)
    setIsIntelligenceOpen(false)
    setIsIntelligencePanelMounted(false)
    setIsPlannerFilterOpen(false)
    setIsPlannerPanelMounted(true)
    window.requestAnimationFrame(() => setIsPlannerOpen(true))
  }

  const closePlanner = () => {
    setIsPlannerOpen(false)
    setIsPlannerFilterOpen(false)
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
    }
    plannerCloseTimerRef.current = setTimeout(() => {
      setIsPlannerPanelMounted(false)
      plannerCloseTimerRef.current = null
    }, 260)
  }

  const openInbox = () => {
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
      inboxCloseTimerRef.current = null
    }
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
      plannerCloseTimerRef.current = null
    }
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
      intelligenceCloseTimerRef.current = null
    }
    setIsPlannerOpen(false)
    setIsPlannerPanelMounted(false)
    setIsIntelligenceOpen(false)
    setIsIntelligencePanelMounted(false)
    setIsInboxPanelMounted(true)
    window.requestAnimationFrame(() => setIsInboxOpen(true))
  }

  const closeInbox = () => {
    setIsInboxOpen(false)
    setIsInboxDropActive(false)
    setInboxRecipientCard(null)
    setInboxSelectedMemberIds([])
    setInboxError('')
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
    }
    inboxCloseTimerRef.current = setTimeout(() => {
      setIsInboxPanelMounted(false)
      inboxCloseTimerRef.current = null
    }, 260)
  }

  const openIntelligence = () => {
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
      intelligenceCloseTimerRef.current = null
    }
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
      plannerCloseTimerRef.current = null
    }
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
      inboxCloseTimerRef.current = null
    }
    setIsPlannerOpen(false)
    setIsPlannerPanelMounted(false)
    setIsPlannerFilterOpen(false)
    setIsInboxOpen(false)
    setIsInboxPanelMounted(false)
    setIsIntelligencePanelMounted(true)
    setIsIntelligenceOpen(true)
  }

  const closeIntelligence = () => {
    setIsIntelligenceOpen(false)
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
    }
    intelligenceCloseTimerRef.current = setTimeout(() => {
      setIsIntelligencePanelMounted(false)
      intelligenceCloseTimerRef.current = null
    }, 260)
  }

  const toggleIntelligence = () => {
    if (isIntelligenceOpen) {
      closeIntelligence()
      return
    }
    openIntelligence()
  }

  useEffect(() => {
    if (!location.state?.openIntelligence) return
    openIntelligence()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.openIntelligence])

  const closeFloatingPanel = () => {
    closeInbox()
    closePlanner()
    closeIntelligence()
  }

  const showBoardView = () => {
    setBoardViewMode('kanban')
    closeFloatingPanel()
  }

  const showCalendarView = () => {
    setBoardViewMode('calendar')
    closeFloatingPanel()
  }

  useEffect(() => {
    if (!isInboxPanelMounted) return
    if (!isBackendDriven) return
    if (!activePlan?.id) return
    if (activePlan.detailsLoaded) return

    ensurePlanDetails(activePlan.id).catch((error) => {
      setInboxError(error?.message ?? 'Não foi possível carregar os membros deste plano.')
    })
  }, [activePlan?.detailsLoaded, activePlan?.id, ensurePlanDetails, isBackendDriven, isInboxPanelMounted])

  useEffect(() => {
    setInboxItems(Array.isArray(activePlan?.inboxItems) ? activePlan.inboxItems : [])
  }, [activePlan?.id, activePlan?.inboxItems])

  useEffect(() => {
    if (!isPlannerFilterOpen) return undefined

    const handlePointerDown = (event) => {
      if (plannerFilterWrapRef.current?.contains(event.target)) return
      setIsPlannerFilterOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsPlannerFilterOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPlannerFilterOpen])

  const notifyToolbarItem = (message) => {
    closeFloatingPanel()
    showNotification(message)
  }

  const handlePlanSwitch = (planId) => {
    openPlan(planId)
  }

	  const todayKey = useMemo(
	    () => dateKeyFromTimeZoneInstant(today, timeZone) ?? dateKey(today),
	    [timeZone, today],
	  )
	  const tomorrowKey = useMemo(() => addDaysToDateKey(todayKey, 1), [todayKey])
	  const plannerPinnedStorageKey = useMemo(
	    () => `plan-things:plannerPinned:${activePlan?.id ?? 'none'}`,
	    [activePlan?.id],
	  )
	  const plannerCollapseStorageKey = useMemo(
	    () => `plan-things:plannerCollapse:${activePlan?.id ?? 'none'}`,
	    [activePlan?.id],
	  )
	  const [plannerSectionOpenById, setPlannerSectionOpenById] = useState({})

	  useEffect(() => {
	    try {
	      const stored = window.localStorage.getItem(plannerPinnedStorageKey)
      const parsed = stored ? JSON.parse(stored) : []
      if (Array.isArray(parsed)) {
        setPlannerPinnedById(Object.fromEntries(parsed.map((id) => [id, true])))
        return
      }
    } catch {}
	    setPlannerPinnedById({})
	  }, [plannerPinnedStorageKey])

	  useEffect(() => {
	    try {
	      const stored = window.localStorage.getItem(plannerCollapseStorageKey)
	      const parsed = stored ? JSON.parse(stored) : null
	      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
	        setPlannerSectionOpenById(parsed)
	        return
	      }
	    } catch {}
	    setPlannerSectionOpenById({})
	  }, [plannerCollapseStorageKey])

	  const defaultPlannerSectionOpen = (sectionId) => {
	    if (sectionId === 'my-day:completed') return false
	    if (sectionId.startsWith('planned:')) return true
	    return true
	  }

	  const persistPlannerPinnedState = (next) => {
	    try {
	      window.localStorage.setItem(plannerPinnedStorageKey, JSON.stringify(Object.keys(next)))
	    } catch {}
	  }

	  const isPlannerSectionOpen = (sectionId) => {
	    const stored = plannerSectionOpenById?.[sectionId]
	    if (typeof stored === 'boolean') return stored
	    return defaultPlannerSectionOpen(sectionId)
	  }

	  const togglePlannerSection = (sectionId) => {
	    setPlannerSectionOpenById((current) => {
	      const currentValue = typeof current?.[sectionId] === 'boolean'
	        ? current[sectionId]
	        : defaultPlannerSectionOpen(sectionId)
	      const nextValue = !currentValue
	      const next = { ...(current ?? {}) }
	      next[sectionId] = nextValue
	      try {
	        window.localStorage.setItem(plannerCollapseStorageKey, JSON.stringify(next))
	      } catch {}
	      return next
	    })
	  }

  const togglePlannerPinned = async (item) => {
    if (item?.type === 'card') {
      const nextStarred = !Boolean(item.pinned)
      const previousPinnedById = plannerPinnedById
      if (previousPinnedById[item.id]) {
        setPlannerPinnedById((current) => {
          if (!current[item.id]) return current
          const next = { ...current }
          delete next[item.id]
          persistPlannerPinnedState(next)
          return next
        })
      }

      try {
        await saveCardOptimistically({
          ...item.card,
          starred: nextStarred,
        })
      } catch (error) {
        if (previousPinnedById[item.id]) {
          setPlannerPinnedById(previousPinnedById)
        }
        showNotification(error?.message ?? 'Não foi possível atualizar o destaque da tarefa.')
      }
      return
    }

	    const itemId = item?.id
	    if (!itemId) return

	    setPlannerPinnedById((current) => {
	      const next = { ...current }
	      if (next[itemId]) {
        delete next[itemId]
      } else {
        next[itemId] = true
      }
      persistPlannerPinnedState(next)
      return next
	    })
	  }

	  useEffect(() => {
	    const legacyPinnedCardIds = Object.keys(plannerPinnedById).filter((itemId) => itemId.startsWith('card:'))
	    if (!legacyPinnedCardIds.length) return

	    const cardByPlannerItemId = new Map(
	      columns.flatMap((column) => column.cards.map((card) => [`card:${card.id}`, card])),
	    )
	    const pendingCards = legacyPinnedCardIds
	      .map((itemId) => ({ itemId, card: cardByPlannerItemId.get(itemId) }))
	      .filter(({ card }) => card && !card.starred)

	    if (!pendingCards.length) return

	    let active = true

	    void (async () => {
	      for (const { itemId, card } of pendingCards) {
	        if (!active) return
	        try {
	          await updateCard({
	            ...card,
	            starred: true,
	          })
	          if (!active) return
	          setPlannerPinnedById((current) => {
	            if (!current[itemId]) return current
	            const next = { ...current }
	            delete next[itemId]
	            persistPlannerPinnedState(next)
	            return next
	          })
	        } catch {}
	      }
	    })()

	    return () => {
	      active = false
	    }
	  }, [columns, plannerPinnedById, plannerPinnedStorageKey, updateCard])

	  const plannerDateFormatter = useMemo(() => new Intl.DateTimeFormat('pt-BR', {
	    timeZone,
	    weekday: 'short',
	    day: 'numeric',
	    month: 'short',
	  }), [timeZone])

	  const plannerBaseItems = useMemo(() => {
	    const planName = activePlan?.name ?? 'Plano'

	    const formatDateLabel = (key) => {
	      if (!key) return 'Sem data'
	      if (key === todayKey) return 'Hoje'
	      if (tomorrowKey && key === tomorrowKey) return 'Amanhã'
	      const date = new Date(`${key}T12:00:00Z`)
	      return plannerDateFormatter.format(date).replace(/\./g, '')
	    }

	    const cardItems = columns
	      .flatMap((column) => column.cards.map((card) => ({
	        column,
	        card,
	      })))
	      .map(({ column, card }) => {
	        const startKey = dateKeyFromTimeZoneInstant(card.startAt?.iso, timeZone)
	        const dueKey = dateKeyFromTimeZoneInstant(card.dueAt?.iso, timeZone)
	        const scheduleKey = dueKey ?? startKey
	        const scheduleIso = card.dueAt?.iso ?? card.startAt?.iso ?? null
	        const timeValue = timeValueFromIsoInTimeZone(scheduleIso, timeZone)
	        const itemId = `card:${card.id}`
	        const dateLabel = formatDateLabel(scheduleKey)

	        return {
	          id: itemId,
	          type: 'card',
	          title: card.title,
	          meta: `${planName} · ${column.title} · ${dateLabel}`,
	          pinned: Boolean(card.starred) || Boolean(plannerPinnedById[itemId]),
	          startKey,
	          dueKey,
	          scheduleKey,
	          timeMinutes: timeValueMinutes(timeValue),
	          isCompleted: Boolean(card.isCompleted),
	          isAssignedToMe: Boolean(
	            currentUser?.id &&
	            Array.isArray(card.memberIds) &&
	            card.memberIds.includes(currentUser.id),
	          ),
	          card,
	          colTitle: column.title,
	        }
	      })

	    const eventItems = plannerCalendarEvents
	      .map((event) => {
	        const rangeLabel = `${formatClockTime(event.start)}–${formatClockTime(event.end)}`
	        const itemId = `event:${event.id}`
	        const dateLabel = formatDateLabel(event.date)
	        return {
	          id: itemId,
	          type: 'event',
	          title: event.title,
	          meta: `Calendário · ${rangeLabel} · ${dateLabel}`,
	          pinned: Boolean(plannerPinnedById[itemId]),
	          startKey: null,
	          dueKey: null,
	          scheduleKey: event.date,
	          timeMinutes: timeValueMinutes(event.start),
	          isCompleted: false,
	          isAssignedToMe: false,
	          event,
	        }
	      })

	    return [...cardItems, ...eventItems]
	  }, [
	    activePlan?.name,
	    columns,
	    currentUser?.id,
	    formatClockTime,
	    plannerDateFormatter,
	    plannerCalendarEvents,
	    plannerPinnedById,
	    timeZone,
	    todayKey,
	    tomorrowKey,
	  ])
	  const plannerFilterCounts = useMemo(() => {
	    const myDayCount = filterPlannerItems(plannerBaseItems, 'my-day', todayKey).length
	    const importantCount = filterPlannerItems(plannerBaseItems, 'important', todayKey).length
	    const plannedCount = filterPlannerItems(plannerBaseItems, 'planned', todayKey).length
	    const completedCount = filterPlannerItems(plannerBaseItems, 'completed', todayKey).length
	    const assignedToMeCount = filterPlannerItems(plannerBaseItems, 'assigned-to-me', todayKey).length

	    return {
	      myDay: myDayCount,
	      important: importantCount,
	      planned: plannedCount,
	      completed: completedCount,
	      assignedToMe: assignedToMeCount,
	    }
	  }, [plannerBaseItems, todayKey])

	  const plannerView = useMemo(() => buildPlannerView({
	    baseItems: plannerBaseItems,
	    filterId: plannerFilter,
	    todayKey,
	  }), [plannerBaseItems, plannerFilter, todayKey])

  const togglePlannerCardCompleted = useCallback(async (card) => {
    try {
      await saveCardOptimistically({
        ...card,
        isCompleted: !card.isCompleted,
      })
    } catch (error) {
      showNotification(error?.message ?? 'Não foi possível atualizar a tarefa.')
    }
  }, [saveCardOptimistically])
  const boardColumnIcons = useMemo(() => ({
    Plus: Icon.Plus,
    More: Icon.More,
    Edit: Icon.Edit,
    Trash: Icon.Trash,
    X: Icon.X,
    Check: Icon.Check,
    Comment: Icon.Comment,
    Clock: Icon.Clock,
    Calendar: Icon.Calendar,
  }), [])
  const hasNoPlan = isBackendDriven && !isLoading && !activePlan
  const isBoardLoading = isBackendDriven && !hasNoPlan && !boardLoadError && (isLoading || !activePlan?.boardLoaded)
  const coverThemeClassName = activePlan?.coverThemeId ? (styles[`theme${activePlan.coverThemeId}`] ?? '') : ''
  const isImageCover = Boolean(activePlan?.coverImage)
  const hasPlanCover = Boolean(coverThemeClassName || isImageCover)
  const boardMainClassName = [
    styles.boardMain,
    hasPlanCover ? styles.boardMainHasCover : '',
    coverThemeClassName,
    isImageCover ? styles.boardMainImageCover : '',
  ].filter(Boolean).join(' ')
  const boardCoverStyle = activePlan?.coverThemeId
    ? {
        '--cover-fallback': activePlan.cover,
      }
    : isImageCover
      ? {
          '--cover-bg': `url(${activePlan.coverImage})`,
        }
      : undefined

  useEffect(() => () => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current)
    }
    if (inboxCloseTimerRef.current) {
      clearTimeout(inboxCloseTimerRef.current)
    }
    if (plannerCloseTimerRef.current) {
      clearTimeout(plannerCloseTimerRef.current)
    }
    if (intelligenceCloseTimerRef.current) {
      clearTimeout(intelligenceCloseTimerRef.current)
    }
  }, [])

  const findBoardCard = (cardId) => (
    columns.flatMap((column) => column.cards).find((card) => card.id === cardId) ?? null
  )

  const mergeInboxRecipientsIntoCard = (cardId, recipientUserIds) => {
    const selectedIds = [...new Set(recipientUserIds.filter(Boolean))]
    if (!selectedIds.length) return

    const mergeMemberIds = (card) => [...new Set([...(card.memberIds ?? []), ...selectedIds])]
    updateColumns((currentColumns) => currentColumns.map((column) => ({
      ...column,
      cards: column.cards.map((card) => (
        card.id === cardId ? { ...card, memberIds: mergeMemberIds(card) } : card
      )),
    })))
    setActiveCard((current) => {
      if (current?.card?.id !== cardId) return current
      return {
        ...current,
        card: {
          ...current.card,
          memberIds: mergeMemberIds(current.card),
        },
      }
    })
  }

  const prependInboxItem = (item) => {
    if (!item?.id) return
    setInboxItems((current) => [
      item,
      ...current.filter((existing) => existing.id !== item.id),
    ])
  }

  const clearInboxDeliveries = async () => {
    if (!activePlan?.id || !isBackendDriven) {
      showNotification('Histórico da Inbox fica disponível apenas quando a sessão está conectada ao backend.')
      return
    }
    if (!inboxItems.length || isClearingInbox) return

    setIsClearingInbox(true)
    setInboxError('')

    try {
      await apiRequest(`/api/plans/${activePlan.id}/board/inbox/deliveries`, {
        method: 'DELETE',
        token: accessToken,
      })
      setInboxItems([])
      showNotification('Envios da Inbox limpos.')
    } catch (error) {
      const message = error?.message ?? 'Não foi possível limpar os envios da Inbox.'
      setInboxError(message)
      showNotification(message)
    } finally {
      setIsClearingInbox(false)
    }
  }

  const sendCardToInbox = async (card, recipientUserIds = []) => {
    if (!activePlan?.id || !isBackendDriven || !card?.id) {
      showNotification('Envio por Gmail fica disponível apenas quando a sessão está conectada ao backend.')
      return
    }
    const newRecipientUserIds = recipientUserIds.filter((id) => !(card.memberIds ?? []).includes(id))
    if (!newRecipientUserIds.length) {
      const message = 'Escolha ao menos um novo membro para receber este cartão por e-mail.'
      setInboxError(message)
      showNotification(message)
      return
    }

    setInboxSendingCardId(card.id)
    setInboxError('')

    try {
      const delivery = await apiRequest(`/api/plans/${activePlan.id}/board/cards/${card.id}/inbox/send`, {
        method: 'POST',
        token: accessToken,
        body: { recipientUserIds: newRecipientUserIds },
      })
      const total = Array.isArray(delivery?.sentTo) ? delivery.sentTo.length : 0
      showNotification(total > 1 ? `E-mail enviado para ${total} membros.` : 'E-mail enviado para 1 membro.')
      mergeInboxRecipientsIntoCard(card.id, newRecipientUserIds)
      prependInboxItem(delivery?.inboxItem)
      setInboxRecipientCard(null)
      setInboxSelectedMemberIds([])
    } catch (error) {
      const message = describeInboxError(error)
      setInboxError(message)
      showNotification(message)
    } finally {
      setInboxSendingCardId('')
    }
  }

  const handleInboxDrop = async (event) => {
    event.preventDefault()
    setIsInboxDropActive(false)

    const cardId = dragState?.cardId
    handleDragEnd()
    if (!cardId) return

    const card = findBoardCard(cardId)
    if (!card) {
      showNotification('Não foi possível identificar o cartão arrastado.')
      return
    }

    setInboxRecipientCard(card)
    setInboxSelectedMemberIds([])
    setInboxError('')
  }

  const handleInboxDragOver = (event) => {
    if (!dragState?.cardId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsInboxDropActive(true)
  }

  const toggleInboxRecipient = (memberId) => {
    setInboxSelectedMemberIds((current) => (
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    ))
  }

  const submitInboxRecipients = () => {
    if (!inboxRecipientCard) return
    if (!inboxSelectedMemberIds.length) {
      setInboxError('Escolha ao menos um novo membro para receber este cartão por e-mail.')
      return
    }

    sendCardToInbox(inboxRecipientCard, inboxSelectedMemberIds)
  }

  const renderInboxItem = (item) => {
    const recipients = Array.isArray(item.recipients) && item.recipients.length
      ? item.recipients.map((recipient) => recipient.fullName || recipient.email).filter(Boolean)
      : (Array.isArray(item.sentTo) ? item.sentTo : [])
    const recipientLabel = recipients.length
      ? recipients.join(', ')
      : 'Destinatários registrados'
    const sentByName = item.sentBy?.fullName || item.sentFrom || 'Gmail conectado'
    const sentAtLabel = item.sentAt?.text ?? 'Agora'

    return (
      <article key={item.id} className={styles.inboxSentCard}>
        <div className={styles.inboxSentCardHeader}>
          <strong>{item.cardTitle ?? 'Cartão enviado'}</strong>
          <span>{sentAtLabel}</span>
        </div>
        <p>{recipientLabel}</p>
        <small>Enviado por {sentByName}</small>
      </article>
    )
  }

  const intelligenceThemeStyle = {
    '--intelligence-accent': boardAccentColor,
    '--intelligence-accent-foreground': boardAccentForeground,
    '--intelligence-user-bg': boardAccentColor,
  }

  const intelligencePanelStyle = {
    left: toolbarMetrics.left ? `${toolbarMetrics.left}px` : undefined,
    width: toolbarMetrics.width ? `${toolbarMetrics.width}px` : undefined,
    bottom: `${toolbarMetrics.bottom + toolbarMetrics.height + 14}px`,
    ...intelligenceThemeStyle,
  }

  const renderInboxPanel = () => (
    <aside
      id="board-inbox-panel"
      className={`${styles.plannerPanel} ${styles.inboxPanel} ${isInboxOpen ? '' : styles.plannerPanelClosing} ${isInboxDropActive ? styles.inboxPanelDropActive : ''}`}
      aria-label="Caixa de entrada"
      onDragOver={handleInboxDragOver}
      onDragEnter={handleInboxDragOver}
      onDragLeave={() => setIsInboxDropActive(false)}
      onDrop={handleInboxDrop}
    >
      <div className={styles.inboxPanelHeader}>
        <div className={styles.inboxPanelTitle}>
          <Icon.Inbox />
          <h2>Caixa de entrada</h2>
        </div>
        <button
          type="button"
          className={styles.plannerCloseButton}
          aria-label="Fechar caixa de entrada"
          onClick={closeInbox}
        >
          <Icon.X />
        </button>
      </div>

      <section className={styles.inboxDropZone} aria-label="Enviar cartão por Gmail">
        <Icon.Send />
        <strong>Solte um cartão para enviar por Gmail</strong>
        <p>O e-mail será enviado pela conta Gmail conectada para membros que ainda não fazem parte do cartão.</p>
      </section>

      {inboxRecipientCard ? (
        <section className={styles.inboxRecipientPicker} aria-label="Escolher destinatários">
          <div className={styles.inboxRecipientHeader}>
            <span>Destinatários</span>
            <strong>{inboxRecipientCard.title}</strong>
          </div>

          <div className={styles.inboxRecipientList}>
            {inboxSelectableMembers.length ? inboxSelectableMembers.map((member) => {
              const memberName = member.name ?? member.fullName ?? 'Membro'
              const checked = inboxSelectedMemberIds.includes(member.id)

              return (
                <label key={member.id} className={styles.inboxRecipientRow}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleInboxRecipient(member.id)}
                  />
                  <AuthenticatedAvatar
                    className={styles.planMemberAvatar}
                    imageClassName={styles.avatarImage}
                    style={{ background: member.color }}
                    avatarUrl={member.avatarUrl}
                    fallback={member.initials}
                    title={memberName}
                  />
                  <span className={styles.inboxRecipientInfo}>
                    <strong>{memberName}</strong>
                    <small>{member.email}</small>
                  </span>
                </label>
              )
            }) : (
              <p className={styles.inboxRecipientsEmpty}>
                {isPlanMembersLoading ? 'Carregando membros do plano...' : 'Todos os membros do plano já fazem parte deste cartão.'}
              </p>
            )}
          </div>

          <div className={styles.inboxRecipientActions}>
            <button
              type="button"
              className={styles.inboxSecondaryButton}
              onClick={() => {
                setInboxRecipientCard(null)
                setInboxSelectedMemberIds([])
                setInboxError('')
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.inboxPrimaryButton}
              onClick={submitInboxRecipients}
              disabled={!inboxSelectedMemberIds.length || inboxSendingCardId === inboxRecipientCard.id}
            >
              {inboxSendingCardId === inboxRecipientCard.id ? 'Enviando...' : 'Enviar e-mail'}
            </button>
          </div>
        </section>
      ) : null}

      {inboxError ? <p className={styles.inboxError} role="alert">{inboxError}</p> : null}

      <section className={styles.inboxSentList} aria-label="Cartões enviados pela Inbox">
        <div className={styles.inboxSentListHeader}>
          <span>Enviados</span>
          <div className={styles.inboxSentListActions}>
            <strong>{inboxItems.length}</strong>
            <button
              type="button"
              className={styles.inboxClearButton}
              aria-label="Limpar envios da Inbox"
              title="Limpar envios da Inbox"
              onClick={clearInboxDeliveries}
              disabled={!inboxItems.length || isClearingInbox}
            >
              <Icon.Trash />
            </button>
          </div>
        </div>
        {inboxItems.length ? (
          <div className={styles.inboxSentItems}>
            {inboxItems.map(renderInboxItem)}
          </div>
        ) : (
          <p className={styles.inboxSentEmpty}>Nenhum cartão enviado pela Inbox ainda.</p>
        )}
      </section>

      <div className={styles.inboxPrivateNote}>
        <Icon.Lock />
        <span>Envios usam somente a permissão Gmail de envio</span>
      </div>
    </aside>
  )

	  const renderPlannerPanel = () => {
		    const plannerFilterOptions = [
		      { id: 'my-day', label: 'Meu Dia', Icon: Icon.Sun, count: plannerFilterCounts.myDay, accent: '#4290da' },
		      { id: 'important', label: 'Importante', Icon: Icon.Star, count: plannerFilterCounts.important, accent: '#d4aef1' },
		      { id: 'planned', label: 'Planejado', Icon: Icon.List, count: plannerFilterCounts.planned, accent: '#0f703a' },
		      { id: 'completed', label: 'Concluída', Icon: Icon.CheckCircle, count: plannerFilterCounts.completed, accent: 'var(--text-3)' },
		      { id: 'assigned-to-me', label: 'Atribuído a mim', Icon: Icon.User, count: plannerFilterCounts.assignedToMe, accent: '#f5a623' },
		    ]

	    const activeFilterOption =
	      plannerFilterOptions.find((option) => option.id === plannerFilter) ?? plannerFilterOptions[0]

	    const totalItems =
	      plannerView.ungroupedItems.length +
	      plannerView.sections.reduce((sum, section) => sum + section.items.length, 0)

	    const renderPlannerItem = (item) => {
	      const isCard = item.type === 'card'
	      const isEvent = item.type === 'event'
	      const itemClassName = [
	        styles.plannerListItem,
	        item.isCompleted ? styles.plannerListItemCompleted : '',
	      ].filter(Boolean).join(' ')

	      const activate = () => {
	        if (isCard) {
	          setActiveCard({ card: item.card, colTitle: item.colTitle })
	          return
	        }
	        if (isEvent) {
	          showCalendarView()
	        }
	      }

	      return (
	        <article
	          key={item.id}
	          className={itemClassName}
	          role="button"
	          tabIndex={0}
	          onClick={activate}
	          onKeyDown={(event) => {
	            if (event.key === 'Enter' || event.key === ' ') {
	              event.preventDefault()
	              activate()
	            }
	          }}
	          aria-label={isCard ? `Abrir tarefa ${item.title}` : `Abrir evento ${item.title}`}
	        >
	          <div className={styles.plannerListLeft}>
	            {isCard ? (
	              <button
	                type="button"
	                className={`${styles.plannerCheckbox} ${item.isCompleted ? styles.plannerCheckboxChecked : ''}`}
	                role="checkbox"
	                aria-checked={item.isCompleted}
	                aria-label={item.isCompleted ? 'Marcar como não concluída' : 'Marcar como concluída'}
	                onClick={(event) => {
	                  event.preventDefault()
	                  event.stopPropagation()
	                  togglePlannerCardCompleted(item.card)
	                }}
	              >
	                {item.isCompleted ? <Icon.Check /> : null}
	              </button>
	            ) : (
	              <span className={styles.plannerEventDot} style={{ background: item.event?.color ?? 'var(--border-2)' }}>
	                <Icon.Calendar />
	              </span>
	            )}
	          </div>

	          <div className={styles.plannerListBody}>
	            <p className={styles.plannerListTitle}>{item.title}</p>
	            <p className={styles.plannerListMeta}>{item.meta}</p>
	          </div>

	          <div className={styles.plannerListRight}>
	            <button
	              type="button"
	              className={`${styles.plannerStarBtn} ${item.pinned ? styles.plannerStarBtnActive : ''}`}
	              aria-pressed={item.pinned}
	              aria-label={item.pinned ? 'Remover estrela' : 'Marcar com estrela'}
	              onClick={(event) => {
	                event.preventDefault()
	                event.stopPropagation()
	                void togglePlannerPinned(item)
	              }}
	            >
	              {item.pinned ? <Icon.StarFill /> : <Icon.Star />}
	            </button>
	          </div>
	        </article>
	      )
	    }

	    const renderPlannerSection = (section) => {
	      const expanded = isPlannerSectionOpen(section.id)
	      return (
	        <div key={section.id} className={styles.plannerSection}>
	          <button
	            type="button"
	            className={styles.plannerSectionHeaderBtn}
	            aria-expanded={expanded}
	            onClick={() => togglePlannerSection(section.id)}
	          >
	            <span className={styles.plannerSectionChevron} aria-hidden="true">
	              <Icon.Chevron />
	            </span>
	            <span className={styles.plannerSectionTitle}>{section.title}</span>
	            <span className={styles.plannerSectionCount}>{section.items.length}</span>
	          </button>
	          {expanded ? (
	            <div className={styles.plannerSectionBody}>
	              {section.items.map(renderPlannerItem)}
	            </div>
	          ) : null}
	        </div>
	      )
	    }

	    return (
	      <aside
	        id="board-planner-panel"
	        className={`${styles.plannerPanel} ${isPlannerOpen ? '' : styles.plannerPanelClosing}`}
	        aria-label="Planejador"
	      >
	        <div className={styles.plannerPanelHeader}>
	          <div>
	            <span className={styles.plannerEyebrow}>Planejador</span>
	            <div ref={plannerFilterWrapRef} className={styles.plannerTitleWrap}>
	              <button
	                type="button"
	                className={styles.plannerTitleButton}
	                aria-haspopup="menu"
	                aria-expanded={isPlannerFilterOpen}
	                onClick={() => setIsPlannerFilterOpen((open) => !open)}
	              >
	                <span>{activeFilterOption.label}</span>
	                <span className={styles.plannerTitleChevron} aria-hidden="true">
	                  <Icon.Chevron />
	                </span>
	                {activeFilterOption.count ? <span className={styles.plannerTitleCount}>{activeFilterOption.count}</span> : null}
	              </button>

		              {isPlannerFilterOpen && (
		                <div className={styles.plannerFilterMenu} role="menu" aria-label="Filtros do planejador">
		                  {plannerFilterOptions.map(({ id, label, Icon: ItemIcon, count, accent }) => (
		                    <button
		                      key={id}
		                      type="button"
		                      className={`${styles.plannerFilterItem} ${plannerFilter === id ? styles.plannerFilterItemActive : ''}`}
		                      style={{ '--planner-filter-accent': accent }}
		                      role="menuitem"
		                      aria-current={plannerFilter === id ? 'true' : undefined}
		                      onClick={() => {
		                        setPlannerFilter(id)
		                        setIsPlannerFilterOpen(false)
	                      }}
	                    >
	                      <ItemIcon />
	                      <span>{label}</span>
	                      {count ? <span className={styles.plannerFilterCount}>{count}</span> : null}
	                    </button>
	                  ))}
	                </div>
	              )}
	            </div>
	          </div>
	          <button
	            type="button"
	            className={styles.plannerCloseButton}
	            aria-label="Fechar planejador"
	            onClick={closePlanner}
	          >
	            <Icon.X />
	          </button>
	        </div>

	        <section className={styles.plannerList} aria-label="Itens do planejador">
	          {totalItems ? (
	            <>
	              {plannerView.ungroupedItems.map(renderPlannerItem)}
	              {plannerView.sections.map(renderPlannerSection)}
	            </>
	          ) : (
	            <div className={styles.plannerEmptyState}>
	              <Icon.Calendar />
	              <strong>Nada para mostrar</strong>
	              <p>Esse filtro não possui tarefas ou eventos no momento.</p>
	            </div>
	          )}
	        </section>
	      </aside>
	    )
	  }

  return (
    <AppThemeScope>
      <div className={styles.boardAccentScope} style={boardAccentStyle}>
      <ProductAppShell
        contentClassName={styles.boardPageShell}
        mobileTitle="Quadros"
      >
        <WorkspaceHeader compact />
        <div
          className={`${styles.boardWrapper} ${isPlannerPanelMounted || isInboxPanelMounted ? styles.boardWrapperPlannerMounted : ''} ${isPlannerOpen || isInboxOpen ? styles.boardWrapperWithPlanner : ''}`}
        >
        <div className={boardMainClassName} style={boardCoverStyle}>
        <section className={styles.boardBody}>
          <div className={styles.boardBodyContent}>
            <BoardHeader
              planName={activePlan?.name ?? 'Plano'}
              viewMode={boardViewMode === 'calendar' ? 'kanban' : boardViewMode}
              onViewModeChange={(nextViewMode) => {
                setBoardViewMode(nextViewMode)
                closeFloatingPanel()
              }}
              members={planMembers}
            />

            {isBoardLoading ? (
              <BoardLoadingState styles={styles} />
            ) : hasNoPlan ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Nenhum plano ativo no momento</p>
                <p className={styles.boardStatusText}>Quando houver um plano disponível, o quadro será exibido aqui.</p>
              </section>
            ) : boardLoadError ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Não foi possível carregar o quadro</p>
                <p className={styles.boardStatusText}>{boardLoadError}</p>
                <button type="button" className={styles.boardStatusRetry} onClick={retryLoadBoard}>
                  Tentar novamente
                </button>
              </section>
            ) : boardViewMode === 'calendar' ? (
              <CalendarWorkspaceView embedded />
            ) : boardViewMode === 'timeline' ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Timeline</p>
                <p className={styles.boardStatusText}>Este modo de visualização estará disponível em breve.</p>
              </section>
            ) : boardViewMode === 'bugtrack' ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Bugtrack</p>
                <p className={styles.boardStatusText}>Este modo de visualização estará disponível em breve.</p>
              </section>
            ) : boardViewMode === 'actions' ? (
              <section className={styles.boardStatusPanel} role="status" aria-live="polite">
                <p className={styles.boardStatusTitle}>Actions</p>
                <p className={styles.boardStatusText}>Este modo de visualização estará disponível em breve.</p>
              </section>
            ) : (
              <div className={styles.board}>
                {columns.map(col => (
                  <KanbanColumn
                    key={col.id}
                    col={col}
                    dragState={dragState}
                    dropTarget={dropTarget}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    onAddCard={addCard}
                    onDeleteCol={handleColumnDelete}
                    onRenameCol={renameColumn}
                    onChangeColColor={handleColumnColorChange}
                    onCardClick={handleBoardCardClick}
                    onToggleCardCompleted={togglePlannerCardCompleted}
                    labels={planLabels}
                    members={planMembers}
                    colorOptions={KANBAN_COLUMN_COLOR_OPTIONS}
                    icons={boardColumnIcons}
                    styles={styles}
                  />
                ))}

                <AddColumnComposer
                  addingCol={addingCol}
                  newColTitle={newColTitle}
                  setNewColTitle={(value) => {
                    setNewColTitle(value)
                    if (addColumnError) {
                      setAddColumnError(null)
                    }
                  }}
                  setAddingCol={setAddingCol}
                  addColumn={addColumn}
                  errorMessage={addColumnError}
                  PlusIcon={Icon.Plus}
                  XIcon={Icon.X}
                  styles={styles}
                />
              </div>
            )}
          </div>
        </section>

        {isIntelligencePanelMounted ? (
          <section
            id="board-intelligence-panel"
            ref={intelligencePanelRef}
            className={`${styles.intelligencePanel} ${hasIntelligenceConversation ? styles.intelligencePanelWithConversation : ''} ${isIntelligenceOpen ? '' : styles.intelligencePanelClosing}`}
            style={intelligencePanelStyle}
            aria-label="Chat de IA"
          >
            <div className={styles.intelligencePanelBody}>
              <div className={styles.intelligencePanelOrbWrap} aria-hidden="true">
                <div className={styles.intelligencePanelOrb} />
              </div>

              {!hasIntelligenceConversation ? (
                <div className={styles.intelligencePanelIntro}>
                  <span className={styles.intelligencePanelEyebrow}>Intelligence</span>
                  <h2 className={styles.intelligencePanelTitle}>Peça ideias para destravar este plano.</h2>
                  <p className={styles.intelligencePanelText}>
                    Resumos, sugestões e próximos passos sem sair do plano.
                  </p>
                </div>
              ) : null}

              <IntelligenceConversationThread
                messages={intelligenceMessages}
                isThinking={isIntelligenceThinking}
                useCustomScrollbar
                scrollToBottomOnMount
                className={styles.intelligencePanelThread}
                classes={{
                  messages: styles.intelligencePanelMessages,
                  messageUser: styles.intelligencePanelMessageUser,
                  messageAssistant: styles.intelligencePanelMessageAssistant,
                  thinking: styles.intelligencePanelThinking,
                }}
              />

              <div
                className={styles.intelligenceComposerArea}
                data-testid="board-intelligence-composer-area"
              >
                <IntelligenceComposer
                  value={intelligenceDraft}
                  onChange={setIntelligenceDraft}
                  inputRef={intelligenceComposerInputRef}
                  rows={1}
                  placeholder="Escreva sua pergunta..."
                  submitAriaLabel="Enviar mensagem"
                  voiceAriaLabelIdle="Usar voz"
                  voiceAriaLabelListening="Usar voz"
                  onSubmit={async (event) => {
                    event.preventDefault()
                    if (await submitIntelligenceMessage(intelligenceDraft)) {
                      setIntelligenceDraft('')
                    }
                  }}
                  submitDisabled={!canSubmitIntelligenceMessage(intelligenceDraft, kanbanAiChips)}
                  aiChips={kanbanAiChips}
                  onChipsChange={setKanbanAiChips}
                  {...composerContext}
                  showGitHubBar={intelligenceActiveConnectors.includes('github')}
                  githubBarClassName={styles.intelligenceGitHubBar}
                  classes={{
                    form: styles.intelligenceComposer,
                    input: styles.intelligenceComposerInput,
                    attachmentStrip: styles.intelligenceComposerAttachmentStrip,
                    controls: styles.intelligenceComposerFooter,
                    contextSlot: styles.intelligenceComposerTools,
                    actions: styles.intelligenceComposerActions,
                    iconButton: styles.intelligenceComposerIconButton,
                    iconButtonActive: styles.intelligenceComposerIconButtonActive,
                    sendButton: styles.intelligenceComposerSubmit,
                  }}
                />
              </div>
            </div>
          </section>
        ) : null}

        <div ref={boardViewToolbarRef} className={styles.boardViewToolbar} aria-label="Atalhos do quadro">
          <button
            type="button"
            className={`${styles.boardViewToolbarItem} ${isInboxOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-expanded={isInboxOpen}
            aria-controls="board-inbox-panel"
            title="Caixa de entrada"
            onClick={openInbox}
          >
            <Icon.Inbox />
            <span>Caixa de entrada</span>
          </button>

          <button
            type="button"
            className={`${styles.boardViewToolbarItem} ${isPlannerOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-expanded={isPlannerOpen}
            aria-controls="board-planner-panel"
            title="Planejador"
            onClick={openPlanner}
          >
            <Icon.Calendar />
            <span>Planejador</span>
          </button>

          <button
            type="button"
            className={`${styles.boardViewToolbarItem} ${boardViewMode === 'kanban' && !isPlannerOpen && !isInboxOpen && !isIntelligenceOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-current={boardViewMode === 'kanban' && !isPlannerOpen && !isInboxOpen && !isIntelligenceOpen ? 'page' : undefined}
            title="Quadro"
            onClick={showBoardView}
          >
            <Icon.Board />
            <span>Quadro</span>
          </button>

          <button
            type="button"
            className={`${styles.boardViewToolbarItem} ${isIntelligenceOpen ? styles.boardViewToolbarItemActive : ''}`}
            aria-expanded={isIntelligenceOpen}
            aria-controls="board-intelligence-panel"
            title="Intelligence"
            onClick={toggleIntelligence}
          >
            <Icon.Bolt />
            <span>Intelligence</span>
          </button>
        </div>
        </div>

        {isInboxPanelMounted && renderInboxPanel()}
        {isPlannerPanelMounted && renderPlannerPanel()}
        </div>
      </ProductAppShell>

      {/* ── Card modal ── */}
      {activeCard && (
        <CardModal
          card={activeCard.card}
          colTitle={activeCard.colTitle}
          onClose={() => setActiveCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
          onAddComment={isBackendDriven ? addCardComment : undefined}
          labels={planLabels}
          members={planMembers}
          currentUser={currentUser}
          calendarDays={CALENDAR_DAYS}
          icons={Icon}
          styles={styles}
          isBackendDriven={isBackendDriven}
          planFiles={planFiles}
          libraryFiles={libraryFiles}
          filesLoading={filesLoading}
          filesError={filesError}
          onLoadFiles={reloadFileLists}
          onAttachFile={attachFileToCard}
          onUploadLocalFile={uploadLocalFileToCard}
          onRemoveAttachment={removeAttachmentFromCard}
          onDownloadFile={downloadFile}
          onCreateChecklist={createChecklist}
          onDeleteChecklist={deleteChecklist}
          onCreateChecklistItem={createChecklistItem}
          onUpdateChecklistItem={updateChecklistItem}
          timeZone={timeZone}
          dateFormat={dateFormat}
        />
      )}

      {notification && (
        <div className={styles.boardNotification} role="status" aria-live="polite">
          {notification}
        </div>
      )}
      </div>
    </AppThemeScope>
  )
}

