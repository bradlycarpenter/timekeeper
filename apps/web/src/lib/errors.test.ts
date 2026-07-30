import { Errors } from '@tk/domain'
import { Cause } from 'effect'
import { describe as group, expect, it } from 'vitest'
import { describe } from './errors'

group('describe', () => {
  it('tells the user which connection is missing', () => {
    expect(
      describe(Cause.fail(new Errors.SheetNotConnected()), 'fallback'),
    ).toBe('Connect your Warp timesheet in Settings first.')

    expect(
      describe(Cause.fail(new Errors.BoardNotConnected()), 'fallback'),
    ).toBe('Connect Jira in Settings first.')
  })

  it('names the upstream service that is misbehaving', () => {
    expect(
      describe(
        Cause.fail(
          new Errors.UpstreamFailed({ service: 'jira', detail: 'timeout' }),
        ),
        'fallback',
      ),
    ).toBe('Jira is not responding. Try again shortly.')

    expect(
      describe(
        Cause.fail(
          new Errors.UpstreamFailed({ service: 'warp', detail: 'timeout' }),
        ),
        'fallback',
      ),
    ).toBe('Warp is not responding. Try again shortly.')
  })

  it('reassures rather than alarms when the day is already filed', () => {
    expect(describe(Cause.fail(new Errors.AlreadyPosted({})), 'fallback')).toBe(
      'That day is already on your timesheet.',
    )
  })

  it('falls back for faults that are not the user to fix', () => {
    expect(describe(Cause.die(new Error('boom')), 'fallback')).toBe('fallback')
    expect(describe(Cause.fail({ nope: true }), 'fallback')).toBe('fallback')
  })
})
