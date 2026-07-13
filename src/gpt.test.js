import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getGptSpreadAnswer } from './gpt'

const spreadCards = [
  { name: 'The Fool', positionEn: 'Situation', positionZh: '處境', reversed: false },
  { name: 'The Tower', positionEn: 'Challenge', positionZh: '挑戰', reversed: true },
  { name: 'The Star', positionEn: 'Advice', positionZh: '建議', reversed: false },
]

describe('getGptSpreadAnswer', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the cards, positions, reversed flags, and question to /api/tarot', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'a reading', persona: 'The Silent Sage' }),
    })

    await getGptSpreadAnswer(spreadCards, 'should I change job?')

    expect(global.fetch).toHaveBeenCalledWith('/api/tarot', expect.objectContaining({ method: 'POST' }))
    const body = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(body.question).toBe('should I change job?')
    expect(body.cards).toHaveLength(3)
    expect(body.cards[1]).toEqual({
      name: 'The Tower',
      positionEn: 'Challenge',
      positionZh: '挑戰',
      reversed: true,
    })
  })

  it('returns the message and persona on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'a reading', persona: 'The Ember Prophet' }),
    })

    const result = await getGptSpreadAnswer(spreadCards)
    expect(result).toEqual({ message: 'a reading', persona: 'The Ember Prophet' })
  })

  it('returns a friendly rate-limit message on 429', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 429 })

    const result = await getGptSpreadAnswer(spreadCards)
    expect(result.persona).toBe('')
    expect(result.message).toMatch(/wait/i)
  })

  it('returns a generic failure message on other HTTP errors', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500 })

    const result = await getGptSpreadAnswer(spreadCards)
    expect(result.message).toMatch(/failed/i)
  })

  it('returns a generic failure message when fetch throws', async () => {
    global.fetch.mockRejectedValue(new Error('network down'))

    const result = await getGptSpreadAnswer(spreadCards)
    expect(result.message).toMatch(/failed/i)
  })
})
