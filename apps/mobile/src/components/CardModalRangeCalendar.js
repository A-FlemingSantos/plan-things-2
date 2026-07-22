import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useMobileTheme, useThemedStyles } from '../theme/ThemeProvider'
import {
  addMonths,
  buildMonthGrid,
  calendarDateToDate,
  compareCalendarDates,
  formatCalendarMonthLabel,
  getWeekdayLabels,
  isSameCalendarDate,
  isTodayCalendarDate,
} from '../utils/calendarDateUtils'

function getRangePosition(date, range) {
  if (!range?.start || !range?.end) {
    return {
      inRange: false,
      isStart: false,
      isEnd: false,
    }
  }

  const compareStart = compareCalendarDates(date, range.start)
  const compareEnd = compareCalendarDates(date, range.end)
  const inRange = compareStart >= 0 && compareEnd <= 0

  return {
    inRange,
    isStart: isSameCalendarDate(date, range.start),
    isEnd: isSameCalendarDate(date, range.end),
  }
}

function resolveNextRange(currentRange, nextDate) {
  if (!currentRange?.start || !currentRange?.end) {
    return { start: nextDate, end: nextDate }
  }

  if (isSameCalendarDate(currentRange.start, currentRange.end)) {
    if (isSameCalendarDate(currentRange.start, nextDate)) {
      return currentRange
    }

    if (compareCalendarDates(nextDate, currentRange.start) <= 0) {
      return { start: nextDate, end: currentRange.start }
    }

    return { start: currentRange.start, end: nextDate }
  }

  return { start: nextDate, end: nextDate }
}

function CalendarDayCell({ date, outsideMonth, range, onPress, styles }) {
  const { inRange, isStart, isEnd } = getRangePosition(date, range)
  const isToday = isTodayCalendarDate(date)
  const isSelectedEndpoint = isStart || isEnd
  const isRangeMiddle = inRange && !isSelectedEndpoint

  return (
    <View
      style={[
        styles.cellWrap,
        inRange && styles.cellWrapInRange,
        isStart && styles.cellWrapStart,
        isEnd && styles.cellWrapEnd,
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.cell,
          outsideMonth && styles.cellOutsideMonth,
          isRangeMiddle && styles.cellRangeMiddle,
          isSelectedEndpoint && styles.cellSelectedEndpoint,
          pressed && !isSelectedEndpoint && styles.cellPressed,
        ]}
        onPress={() => onPress(date)}
        accessibilityRole="button"
        accessibilityState={{ selected: inRange }}
        accessibilityLabel={`${date.day}/${date.month}/${date.year}`}
      >
        <Text
          style={[
            styles.cellLabel,
            outsideMonth && styles.cellLabelOutsideMonth,
            isSelectedEndpoint && styles.cellLabelSelected,
          ]}
        >
          {date.day}
        </Text>
        {isToday ? (
          <View
            style={[
              styles.todayDot,
              isSelectedEndpoint && styles.todayDotSelected,
            ]}
          />
        ) : null}
      </Pressable>
    </View>
  )
}

export default function CardModalRangeCalendar({ value, onChange, visibleMonth: visibleMonthProp }) {
  const styles = useThemedStyles(createStyles)
  const { theme: activeTheme } = useMobileTheme()
  const [internalVisibleMonth, setInternalVisibleMonth] = useState(() => {
    const anchor = value?.end ?? value?.start
    return anchor ? calendarDateToDate(anchor) : new Date()
  })
  const visibleMonth = visibleMonthProp ?? internalVisibleMonth
  const weekdayLabels = useMemo(() => getWeekdayLabels(), [])
  const monthDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth])

  const setVisibleMonth = (nextMonth) => {
    if (!visibleMonthProp) {
      setInternalVisibleMonth(nextMonth)
    }
  }

  const handleDayPress = (date) => {
    onChange?.(resolveNextRange(value, date))
  }

  return (
    <View style={styles.calendar} accessibilityLabel="Calendário de datas">
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
          onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
        >
          <ChevronLeft size={16} color={activeTheme.colors.text3} strokeWidth={2} />
        </Pressable>
        <Text style={styles.heading}>{formatCalendarMonthLabel(visibleMonth)}</Text>
        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
          onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
        >
          <ChevronRight size={16} color={activeTheme.colors.text3} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekdayLabel}>{label}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {monthDays.map((day) => (
          <CalendarDayCell
            key={`${day.date.year}-${day.date.month}-${day.date.day}`}
            date={day.date}
            outsideMonth={day.outsideMonth}
            range={value}
            onPress={handleDayPress}
            styles={styles}
          />
        ))}
      </View>
    </View>
  )
}

const createStyles = (activeTheme) => {
  const rangeFill = activeTheme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'

  return StyleSheet.create({
    calendar: {
      width: 252,
      alignSelf: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingBottom: 4,
    },
    navButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
    },
    navButtonPressed: {
      backgroundColor: activeTheme.colors.surface3,
    },
    heading: {
      flex: 1,
      textAlign: 'center',
      color: activeTheme.colors.text1,
      fontSize: 14,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    weekdayRow: {
      flexDirection: 'row',
    },
    weekdayLabel: {
      width: 36,
      height: 36,
      textAlign: 'center',
      textAlignVertical: 'center',
      color: activeTheme.colors.text3,
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 36,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: 252,
    },
    cellWrap: {
      width: 36,
      height: 36,
    },
    cellWrapInRange: {
      backgroundColor: rangeFill,
    },
    cellWrapStart: {
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    },
    cellWrapEnd: {
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
    },
    cell: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
      position: 'relative',
    },
    cellOutsideMonth: {
      opacity: 0.72,
    },
    cellRangeMiddle: {
      borderRadius: 0,
      borderWidth: 0,
    },
    cellSelectedEndpoint: {
      backgroundColor: activeTheme.colors.text1,
      borderColor: activeTheme.colors.text1,
    },
    cellPressed: {
      backgroundColor: activeTheme.colors.surface3,
    },
    cellLabel: {
      color: activeTheme.colors.text1,
      fontSize: 14,
      fontWeight: '400',
    },
    cellLabelOutsideMonth: {
      color: activeTheme.colors.text3,
    },
    cellLabelSelected: {
      color: activeTheme.colors.textInverse,
    },
    todayDot: {
      position: 'absolute',
      bottom: 4,
      width: 3,
      height: 3,
      borderRadius: 999,
      backgroundColor: activeTheme.colors.text1,
    },
    todayDotSelected: {
      backgroundColor: activeTheme.colors.surface1,
    },
  })
}
