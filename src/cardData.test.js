import { describe, it, expect } from 'vitest'
import cards, { drawThreeCards } from './cardData'

describe('cards', () => {
  it('has 22 major arcana cards, each with name/message/image', () => {
    expect(cards).toHaveLength(22)
    cards.forEach((c) => {
      expect(typeof c.name).toBe('string')
      expect(typeof c.message).toBe('string')
      expect(c.image).toBeTruthy()
    })
  })

  it('has no duplicate card names', () => {
    const names = cards.map((c) => c.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('drawThreeCards', () => {
  it('draws exactly 3 cards', () => {
    expect(drawThreeCards()).toHaveLength(3)
  })

  it('never draws duplicate cards within a single spread', () => {
    for (let i = 0; i < 200; i++) {
      const names = drawThreeCards().map((c) => c.name)
      expect(new Set(names).size).toBe(3)
    }
  })

  it('only draws cards that exist in the deck', () => {
    const validNames = new Set(cards.map((c) => c.name))
    for (let i = 0; i < 50; i++) {
      drawThreeCards().forEach((c) => expect(validNames.has(c.name)).toBe(true))
    }
  })

  it('assigns a boolean reversed flag to every card', () => {
    drawThreeCards().forEach((c) => expect(typeof c.reversed).toBe('boolean'))
  })

  it('reverses roughly 35% of cards across many draws (statistical, generous tolerance)', () => {
    let reversedCount = 0
    let total = 0
    for (let i = 0; i < 600; i++) {
      drawThreeCards().forEach((c) => {
        total += 1
        if (c.reversed) reversedCount += 1
      })
    }
    const ratio = reversedCount / total
    expect(ratio).toBeGreaterThan(0.2)
    expect(ratio).toBeLessThan(0.5)
  })
})
