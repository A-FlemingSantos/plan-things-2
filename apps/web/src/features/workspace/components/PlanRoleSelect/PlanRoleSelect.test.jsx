import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PlanRoleSelect from './PlanRoleSelect.jsx'

const OPTIONS = [
  { value: 'MEMBER', label: 'Membro' },
  { value: 'ADMIN', label: 'Admin' },
]

describe('PlanRoleSelect', () => {
  it('notifies onOpenChange when the menu opens and closes', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onChange = vi.fn()

    render(
      <PlanRoleSelect
        value="MEMBER"
        onChange={onChange}
        options={OPTIONS}
        ariaLabel="Nível de permissão"
        onOpenChange={onOpenChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Nível de permissão' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: 'Admin' }))
    expect(onChange).toHaveBeenCalledWith('ADMIN')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
