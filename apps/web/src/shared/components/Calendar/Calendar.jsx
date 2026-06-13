import { getLocalTimeZone, today } from '@internationalized/date'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Button,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
  CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  Heading as HeadingRac,
  RangeCalendar as RangeCalendarRac,
  composeRenderProps,
} from 'react-aria-components'
import styles from './Calendar.module.css'

function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

function CalendarHeader() {
  return (
    <header className={styles.header}>
      <Button slot="previous" className={styles.navButton}>
        <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
      </Button>
      <HeadingRac className={styles.heading} />
      <Button slot="next" className={styles.navButton}>
        <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
      </Button>
    </header>
  )
}

function CalendarGridComponent({ isRange = false }) {
  const now = today(getLocalTimeZone())

  return (
    <CalendarGridRac className={styles.grid}>
      <CalendarGridHeaderRac>
        {(day) => (
          <CalendarHeaderCellRac className={styles.headerCell}>
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac className={styles.gridBody}>
        {(date) => {
          const isToday = date.compare(now) === 0

          return (
            <CalendarCellRac
              date={date}
              className={cn(
                styles.cell,
                isRange ? styles.cellRange : '',
                isToday ? (isRange ? styles.cellRangeToday : styles.cellToday) : '',
              )}
            />
          )
        }}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  )
}

export function Calendar({ className, ...props }) {
  return (
    <CalendarRac
      {...props}
      className={composeRenderProps(className, (nextClassName) => cn(styles.calendar, nextClassName))}
    >
      <CalendarHeader />
      <CalendarGridComponent />
    </CalendarRac>
  )
}

export function RangeCalendar({ className, ...props }) {
  return (
    <RangeCalendarRac
      {...props}
      className={composeRenderProps(className, (nextClassName) => cn(styles.rangeCalendar, nextClassName))}
    >
      <CalendarHeader />
      <CalendarGridComponent isRange />
    </RangeCalendarRac>
  )
}
