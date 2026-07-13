import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from './tarot.js'

function createRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

function createReq({ method = 'POST', body = {}, ip = '1.2.3.4' } = {}) {
  return {
    method,
    body,
    headers: { 'x-forwarded-for': ip },
    socket: { remoteAddress: ip },
  }
}

const validCards = [
  { name: 'The Fool', positionEn: 'Situation', positionZh: '處境', reversed: false },
  { name: 'The Tower', positionEn: 'Challenge', positionZh: '挑戰', reversed: true },
  { name: 'The Star', positionEn: 'Advice', positionZh: '建議', reversed: false },
]

describe('POST /api/tarot', () => {
  const originalKey = process.env.OPENAI_API_KEY

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key'
    global.fetch = vi.fn()
  })

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey
    vi.restoreAllMocks()
  })

  it('rejects non-POST methods', async () => {
    const res = createRes()
    await handler(createReq({ method: 'GET', ip: '10.0.0.1' }), res)
    expect(res.statusCode).toBe(405)
  })

  it('rejects a request missing cards', async () => {
    const res = createRes()
    await handler(createReq({ body: {}, ip: '10.0.0.2' }), res)
    expect(res.statusCode).toBe(400)
  })

  it('rejects a request with fewer than 3 cards', async () => {
    const res = createRes()
    await handler(createReq({ body: { cards: validCards.slice(0, 2) }, ip: '10.0.0.3' }), res)
    expect(res.statusCode).toBe(400)
  })

  it('rejects a card missing positionEn', async () => {
    const res = createRes()
    const badCards = [validCards[0], { name: 'The Tower', reversed: false }, validCards[2]]
    await handler(createReq({ body: { cards: badCards }, ip: '10.0.0.4' }), res)
    expect(res.statusCode).toBe(400)
  })

  it('returns 500 if OPENAI_API_KEY is not configured', async () => {
    delete process.env.OPENAI_API_KEY
    const res = createRes()
    await handler(createReq({ body: { cards: validCards }, ip: '10.0.0.5' }), res)
    expect(res.statusCode).toBe(500)
  })

  it('calls OpenAI and returns the reading plus the chosen persona', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'a mystical reading' } }] }),
    })

    const res = createRes()
    await handler(createReq({ body: { cards: validCards }, ip: '10.0.0.6' }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.message).toBe('a mystical reading')
    expect(['The Moon-Quiet Oracle', 'The Ember Prophet', 'The Silent Sage']).toContain(res.body.persona)
  })

  it('returns 502 when the OpenAI request fails', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' })

    const res = createRes()
    await handler(createReq({ body: { cards: validCards }, ip: '10.0.0.7' }), res)
    expect(res.statusCode).toBe(502)
  })

  it('rate limits after 5 requests from the same IP within a minute', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'reading' } }] }),
    })

    const ip = '10.0.0.8'
    for (let i = 0; i < 5; i += 1) {
      const res = createRes()
      await handler(createReq({ body: { cards: validCards }, ip }), res)
      expect(res.statusCode).toBe(200)
    }

    const limitedRes = createRes()
    await handler(createReq({ body: { cards: validCards }, ip }), limitedRes)
    expect(limitedRes.statusCode).toBe(429)
  })

  it('does not rate limit a different IP', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'reading' } }] }),
    })
    const res = createRes()
    await handler(createReq({ body: { cards: validCards }, ip: '10.0.0.9' }), res)
    expect(res.statusCode).toBe(200)
  })
})
