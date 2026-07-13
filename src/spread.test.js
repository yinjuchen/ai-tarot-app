import { describe, it, expect } from 'vitest'
import { POSITIONS } from './spread'

describe('POSITIONS', () => {
  it('defines exactly 3 positions in Situation/Challenge/Advice order', () => {
    expect(POSITIONS).toHaveLength(3)
    expect(POSITIONS.map((p) => p.en)).toEqual(['Situation', 'Challenge', 'Advice'])
  })

  it('has a non-empty Traditional Chinese label for every position', () => {
    POSITIONS.forEach((p) => {
      expect(typeof p.zh).toBe('string')
      expect(p.zh.length).toBeGreaterThan(0)
    })
  })
})
