import { describe, expect, it } from 'vitest'
import { getPlanAdministrators } from './BoardAboutPlanPopover.jsx'

describe('getPlanAdministrators', () => {
  it('returns admins and creators', () => {
    const members = [
      { id: '1', role: 'MEMBER' },
      { id: '2', role: 'ADMIN' },
      { id: '3', role: 'MEMBER', isCreator: true },
    ]

    expect(getPlanAdministrators(members).map((member) => member.id)).toEqual(['2', '3'])
  })

  it('falls back to the first member when no admin is defined', () => {
    const members = [{ id: '1', role: 'MEMBER' }]

    expect(getPlanAdministrators(members)).toEqual([members[0]])
  })
})
