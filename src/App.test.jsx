import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import App from './App'
import { getGptSpreadAnswer } from './gpt'

vi.mock('./components/StarsBackground', () => ({ default: () => null }))

vi.mock('./gpt', () => ({
  getGptSpreadAnswer: vi.fn(),
}))

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    getGptSpreadAnswer.mockResolvedValue({ message: 'English line\n中文行', persona: 'The Silent Sage' })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders the initial screen', () => {
    render(<App />)
    expect(screen.getByText('AI Tarot')).toBeInTheDocument()
    expect(screen.getByText(/Open the Veil/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/What's on your mind/)).toBeInTheDocument()
  })

  it('clears the question input as soon as a draw starts', () => {
    render(<App />)
    const input = screen.getByPlaceholderText(/What's on your mind/)
    fireEvent.change(input, { target: { value: 'should I move abroad?' } })
    fireEvent.click(screen.getByText(/Open the Veil/))
    expect(input.value).toBe('')
  })

  it('draws three cards and shows the reading after the full reveal sequence', async () => {
    render(<App />)
    fireEvent.click(screen.getByText(/Open the Veil/))

    // advance through the "veil parting" pause + staggered card reveal
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500 + 650 * 3 + 100)
    })

    await waitFor(() => {
      expect(screen.getByText('English line')).toBeInTheDocument()
    })
    expect(screen.getByText(/The Silent Sage/)).toBeInTheDocument()
    expect(getGptSpreadAnswer).toHaveBeenCalledTimes(1)

    const [spreadArg] = getGptSpreadAnswer.mock.calls[0]
    expect(spreadArg).toHaveLength(3)
    expect(new Set(spreadArg.map((c) => c.name)).size).toBe(3)
  })

  it('submits the typed question along with the draw', async () => {
    render(<App />)
    const input = screen.getByPlaceholderText(/What's on your mind/)
    fireEvent.change(input, { target: { value: 'should I change job?' } })
    fireEvent.click(screen.getByText(/Open the Veil/))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500 + 650 * 3 + 100)
    })
    await waitFor(() => expect(getGptSpreadAnswer).toHaveBeenCalledTimes(1))

    const [, questionArg] = getGptSpreadAnswer.mock.calls[0]
    expect(questionArg).toBe('should I change job?')
  })
})
