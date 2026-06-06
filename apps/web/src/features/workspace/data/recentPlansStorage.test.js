import { beforeEach, describe, expect, it } from 'vitest'
import {
  readRecentPlanIds,
  recordRecentPlan,
  removeRecentPlan,
} from './recentPlansStorage.js'

describe('recentPlansStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('records and deduplicates recent plans for a user', () => {
    recordRecentPlan('user-1', 'plan-a')
    recordRecentPlan('user-1', 'plan-b')
    const next = recordRecentPlan('user-1', 'plan-a')

    expect(next).toEqual(['plan-a', 'plan-b'])
    expect(readRecentPlanIds('user-1')).toEqual(['plan-a', 'plan-b'])
  })

  it('removes deleted plans from recents', () => {
    recordRecentPlan('user-1', 'plan-a')
    recordRecentPlan('user-1', 'plan-b')

    const next = removeRecentPlan('user-1', 'plan-a')

    expect(next).toEqual(['plan-b'])
    expect(readRecentPlanIds('user-1')).toEqual(['plan-b'])
  })
})
