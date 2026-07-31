import {
  RouterProvider,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LegalPage } from './legal-page.tsx'

const renderRoot = (children: React.ReactNode) => {
  const rootRoute = createRootRoute({ component: () => children })
  const router = createRouter({ routeTree: rootRoute })
  return render(<RouterProvider router={router} />)
}

describe('LegalPage.Root', () => {
  it('links to privacy, terms, and support', async () => {
    renderRoot(<LegalPage.Root>content</LegalPage.Root>)

    expect(
      (await screen.findByRole('link', { name: 'Privacy policy' })).getAttribute('href'),
    ).toBe('/privacy')
    expect(
      screen.getByRole('link', { name: 'Terms of service' }).getAttribute('href'),
    ).toBe('/terms')
    expect(
      screen.getByRole('link', { name: 'Support' }).getAttribute('href'),
    ).toBe('/support')
  })
})

describe('LegalPage.Title', () => {
  it('shows the heading and the last-updated date', () => {
    render(<LegalPage.Title heading="Privacy policy" updated="31 July 2026" />)

    expect(screen.getByRole('heading', { name: 'Privacy policy' })).toBeTruthy()
    expect(screen.getByText('Last updated: 31 July 2026')).toBeTruthy()
  })
})

describe('LegalPage.Section and LegalPage.Body', () => {
  it('renders paragraphs and an optional list under a heading', () => {
    render(
      <LegalPage.Section heading="Your choices">
        <LegalPage.Body
          paragraphs={['You can disconnect at any time.']}
          list={['Disconnect Warp', 'Disconnect Jira']}
        />
      </LegalPage.Section>,
    )

    expect(screen.getByRole('heading', { name: 'Your choices' })).toBeTruthy()
    expect(screen.getByText('You can disconnect at any time.')).toBeTruthy()
    expect(screen.getByText('Disconnect Warp')).toBeTruthy()
    expect(screen.getByText('Disconnect Jira')).toBeTruthy()
  })

  it('omits the list when none is given', () => {
    render(
      <LegalPage.Section heading="Overview">
        <LegalPage.Body paragraphs={['Just prose.']} />
      </LegalPage.Section>,
    )

    expect(screen.queryByRole('list')).toBeNull()
  })
})
