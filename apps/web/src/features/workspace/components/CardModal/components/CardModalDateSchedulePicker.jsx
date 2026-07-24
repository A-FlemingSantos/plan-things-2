import { useEffect, useMemo, useRef } from 'react'
import { RangeCalendar as DateRangeCalendar } from '../../../../../shared/components/Calendar/Calendar.jsx'
import { resolveCardScheduleFromRange } from '../../../../../shared/components/Calendar/calendarDateUtils.js'
import {
  buildCardScheduleTimeSlots,
  formatCardScheduleSummary,
  snapCardScheduleTimeToSlot,
} from '../utils/cardModalScheduleUtils.js'

const TIME_SLOTS = buildCardScheduleTimeSlots()

export default function CardModalDateSchedulePicker({
  styles,
  calendarRange,
  dueTimeValue,
  onCalendarRangeChange,
  onTimeChange,
  onConfirm,
  confirmDisabled = false,
  isConfirming = false,
}) {
  const selectedTimeRef = useRef(null)
  const selectedTime = snapCardScheduleTimeToSlot(dueTimeValue)
  const resolvedSchedule = useMemo(
    () => resolveCardScheduleFromRange(calendarRange),
    [calendarRange],
  )
  const summary = formatCardScheduleSummary({
    startEnabled: resolvedSchedule?.startEnabled,
    startDateValue: resolvedSchedule?.startDateValue,
    dueDateValue: resolvedSchedule?.dueDateValue,
    dueTimeValue: selectedTime,
  })
  const canConfirm = Boolean(resolvedSchedule?.dueDateValue && selectedTime) && !confirmDisabled && !isConfirming

  useEffect(() => {
    selectedTimeRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    })
  }, [selectedTime])

  return (
    <div className={styles.cmDateSchedulePicker}>
      <div className={styles.cmDateScheduleBody}>
        <div className={styles.cmDateScheduleCalendar}>
          <DateRangeCalendar
            value={calendarRange ?? undefined}
            onChange={onCalendarRangeChange}
            aria-label="Calendário de datas"
          />
        </div>

        <div className={styles.cmDateScheduleTimePane}>
          <div
            className={styles.cmDateScheduleTimeList}
            role="listbox"
            aria-label="Horários disponíveis"
          >
            {TIME_SLOTS.map((slot) => {
              const isSelected = slot === selectedTime

              return (
                <button
                  key={slot}
                  ref={isSelected ? selectedTimeRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.cmDateScheduleTimeSlot} ${isSelected ? styles.cmDateScheduleTimeSlotSelected : ''}`}
                  onClick={() => onTimeChange?.(slot)}
                >
                  {slot}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className={styles.cmDateScheduleFooter}>
        <p className={styles.cmDateScheduleSummary}>{summary}</p>
        <button
          type="button"
          className={styles.cmDateScheduleConfirm}
          onClick={onConfirm}
          disabled={!canConfirm}
        >
          {isConfirming ? 'Salvando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}
