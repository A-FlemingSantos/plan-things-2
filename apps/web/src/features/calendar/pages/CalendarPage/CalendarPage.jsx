import { CalendarWorkspaceView } from '../../components/CalendarWorkspaceView/CalendarWorkspaceView.jsx'

/**
 * Calendar page module.
 *
 * - `CalendarPage` — standalone full-page shell (tests; `/calendar` redirects to board).
 * - `CalendarWorkspaceView` — legacy re-export for mocks targeting this path;
 *   implementation lives in `components/CalendarWorkspaceView/`.
 */
export { CalendarWorkspaceView }

/** Standalone calendar page entry (non-embedded). */
export function CalendarPage() {
  return <CalendarWorkspaceView />
}
