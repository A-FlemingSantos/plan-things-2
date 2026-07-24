import { describe, expect, it } from 'vitest'
import {
  buildCardScheduleTimeSlots,
  formatCardScheduleSummary,
  normalizeCardScheduleTimeValue,
  snapCardScheduleTimeToSlot,
} from './cardModalScheduleUtils.js'

describe('cardModalScheduleUtils', () => {
  it('builds 15-minute time slots for a full day', () => {
    const slots = buildCardScheduleTimeSlots()

    expect(slots[0]).toBe('00:00')
    expect(slots).toContain('09:15')
    expect(slots).toContain('10:00')
    expect(slots.at(-1)).toBe('23:45')
    expect(slots).toHaveLength(96)
  })

  it('normalizes and snaps time values to valid slots', () => {
    expect(normalizeCardScheduleTimeValue('9:5')).toBe('09:05')
    expect(normalizeCardScheduleTimeValue('invalid', '10:00')).toBe('10:00')
    expect(snapCardScheduleTimeToSlot('10:07')).toBe('10:00')
    expect(snapCardScheduleTimeToSlot('10:08')).toBe('10:15')
  })

  it('formats a single-day schedule summary in Portuguese', () => {
    expect(formatCardScheduleSummary({
      dueDateValue: '12/06/2025',
      dueTimeValue: '10:00',
    })).toBe('Agendado para Quinta-feira, 12 de junho às 10:00.')
  })

  it('formats a range schedule summary in Portuguese', () => {
    expect(formatCardScheduleSummary({
      startEnabled: true,
      startDateValue: '10/06/2025',
      dueDateValue: '12/06/2025',
      dueTimeValue: '10:00',
    })).toBe('Agendado de 10 de junho a 12 de junho às 10:00.')
  })

  it('asks for selection when date or time is missing', () => {
    expect(formatCardScheduleSummary({
      dueDateValue: '',
      dueTimeValue: '10:00',
    })).toBe('Selecione uma data e um horário para confirmar.')
  })
})
