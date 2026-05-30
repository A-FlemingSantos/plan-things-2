// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildMockIntelligenceReply } from './buildMockIntelligenceReply.js'

describe('buildMockIntelligenceReply', () => {
  it('returns markdown-only reply for generic prompts', () => {
    const reply = buildMockIntelligenceReply('Me ajude com prioridades')

    expect(reply.summary).toBeTruthy()
    expect(reply.blocks).toHaveLength(1)
    expect(reply.blocks[0].type).toBe('MARKDOWN')
  })

  it('returns full plan flow blocks when user asks to create a plan', () => {
    const reply = buildMockIntelligenceReply('Quero criar um plano de marketing')

    expect(reply.blocks.map((block) => block.type)).toEqual([
      'MARKDOWN',
      'TOOL_RUN_SUMMARY',
      'PLAN_PROPOSAL',
      'PLAN_REFERENCE',
    ])
    expect(reply.blocks.at(-1)?.payload?.href).toBe('/workspace/board/product-launch-q3')
  })

  it('returns card batch flow for card-related prompts', () => {
    const reply = buildMockIntelligenceReply('Adicione cartões no kanban')

    expect(reply.blocks.some((block) => block.type === 'CARD_BATCH_PROPOSAL')).toBe(true)
    expect(reply.blocks.some((block) => block.type === 'CARD_REFERENCE')).toBe(true)
    expect(reply.blocks.find((block) => block.type === 'CARD_REFERENCE')?.payload?.href)
      .toBe('/workspace/board/product-launch-q3?card=mock-card-1')
  })

  it('uses plan chip label in plan proposal scenario', () => {
    const reply = buildMockIntelligenceReply('Organize isso', {
      imageAttachments: [],
      fileAttachments: [],
      contextChips: [{ id: '1', kind: 'plan', type: 'plan-1', label: 'Lançamento Q3' }],
    })

    const proposal = reply.blocks.find((block) => block.type === 'PLAN_PROPOSAL')
    expect(proposal?.payload?.preview?.title).toContain('Lançamento Q3')
  })
})
