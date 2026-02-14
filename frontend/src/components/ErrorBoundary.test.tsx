import { render, screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

function ThrowingChild() {
  throw new Error('Test crash')
}

function GoodChild() {
  return <div>Everything is fine</div>
}

describe('ErrorBoundary', () => {
  const originalError = console.error
  beforeAll(() => { console.error = () => {} })
  afterAll(() => { console.error = originalError })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('Everything is fine')).toBeInTheDocument()
  })

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Return to Dashboard')).toBeInTheDocument()
  })

  it('error recovery link points to root', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    )
    const link = screen.getByText('Return to Dashboard')
    expect(link.getAttribute('href')).toBe('/')
  })
})
