import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="ready" />)
    expect(screen.getByText('ready')).toBeInTheDocument()
  })

  it('applies green style for ready status', () => {
    render(<StatusBadge status="ready" />)
    const badge = screen.getByText('ready')
    expect(badge.className).toContain('bg-green-100')
    expect(badge.className).toContain('text-green-700')
  })

  it('applies red style for error status', () => {
    render(<StatusBadge status="error" />)
    const badge = screen.getByText('error')
    expect(badge.className).toContain('bg-red-100')
  })

  it('applies blue style for processing status', () => {
    render(<StatusBadge status="processing" />)
    const badge = screen.getByText('processing')
    expect(badge.className).toContain('bg-blue-100')
  })

  it('applies yellow style for pending status', () => {
    render(<StatusBadge status="pending" />)
    const badge = screen.getByText('pending')
    expect(badge.className).toContain('bg-yellow-100')
  })

  it('applies gray fallback for unknown status', () => {
    render(<StatusBadge status="unknown" />)
    const badge = screen.getByText('unknown')
    expect(badge.className).toContain('bg-gray-100')
  })
})
