import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import Home from '@/app/(auth)/mail/page'
import dynamic from 'next/dynamic'

// Mock dynamic import for MailPage
jest.mock('next/dynamic', () => {
  return jest.fn((importFunc, options) => {
    // Simulate dynamic loading with fallback and loaded component
    const MockComponent = () => <div data-testid="mail-page">Mail Page Loaded</div>
    MockComponent.displayName = 'MockMailPage'

    if (options && options.loading) {
      // Return a component that renders the loading component first
      return (props: any) => {
        const [loaded, setLoaded] = React.useState(false)
        React.useEffect(() => {
          setTimeout(() => setLoaded(true), 0)
        }, [])
        return loaded ? <MockComponent {...props} /> : options.loading()
      }
    }
    return MockComponent
  })
})

// Mock child components that are imported but not in scope here
jest.mock('@/components/theme-toggle', () => ({
  ModeToggle: () => <div data-testid="mode-toggle" />,
}))
jest.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button" />,
}))
jest.mock('@/app/mail/components/compose-button', () => () => <button data-testid="compose-button">Compose</button>)
jest.mock('@/app/mail/components/webhook-debugger', () => () => <div data-testid="webhook-debugger" />)

describe('Home page integration', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('renders main UI components', async () => {
    // Set NODE_ENV to 'production' - webhook debugger should NOT render
    process.env.NODE_ENV = 'production'

    render(<Home />)

    // UserButton, ModeToggle, ComposeButton must be present
    expect(screen.getByTestId('user-button')).toBeInTheDocument()
    expect(screen.getByTestId('mode-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('compose-button')).toBeInTheDocument()

    // WebhookDebugger should NOT be present in production
    expect(screen.queryByTestId('webhook-debugger')).not.toBeInTheDocument()

    // Initially, MailPage should show loading fallback
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Wait for MailPage to load and replace loading
    await waitFor(() => {
      expect(screen.getByTestId('mail-page')).toBeInTheDocument()
    })
  })

  it('shows webhook debugger in development mode', async () => {
    process.env.NODE_ENV = 'development'

    render(<Home />)

    expect(screen.getByTestId('webhook-debugger')).toBeInTheDocument()
  })
})
