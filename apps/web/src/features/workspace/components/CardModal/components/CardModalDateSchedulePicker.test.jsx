import { CalendarDate } from '@internationalized/date'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import styles from '../../../pages/KanbanBoard/KanbanBoard.module.css'
import CardModalDateSchedulePicker from './CardModalDateSchedulePicker.jsx'

describe('CardModalDateSchedulePicker', () => {
  it('renders time slots, summary and confirm action', async () => {
    const user = userEvent.setup()
    const onTimeChange = vi.fn()
    const onConfirm = vi.fn()
    const range = {
      start: new CalendarDate(2025, 6, 12),
      end: new CalendarDate(2025, 6, 12),
    }

    render(
      <CardModalDateSchedulePicker
        styles={styles}
        calendarRange={range}
        dueTimeValue="10:00"
        onCalendarRangeChange={() => {}}
        onTimeChange={onTimeChange}
        onConfirm={onConfirm}
      />,
    )

    expect(screen.getByRole('listbox', { name: 'Horários disponíveis' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '10:00' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Agendado para Quinta-feira, 12 de junho às 10:00.')).toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: '10:15' }))
    expect(onTimeChange).toHaveBeenCalledWith('10:15')

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('disables confirm while saving', () => {
    render(
      <CardModalDateSchedulePicker
        styles={styles}
        calendarRange={{
          start: new CalendarDate(2025, 6, 12),
          end: new CalendarDate(2025, 6, 12),
        }}
        dueTimeValue="10:00"
        onCalendarRangeChange={() => {}}
        onTimeChange={() => {}}
        onConfirm={() => {}}
        isConfirming
      />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })
})
