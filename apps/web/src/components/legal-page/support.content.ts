import { CONTACT_EMAIL } from './legal-page.constants.ts'
import type { LegalContent } from './legal-page.types.ts'

export const SUPPORT_CONTENT: LegalContent = {
  title: 'Support',
  intro:
    'Timekeeper is maintained by one person, so support is handled directly by email rather than a ticketing system.',
  sections: [
    {
      heading: 'Get help',
      paragraphs: [
        `Email ${CONTACT_EMAIL} with a description of the problem. We aim to respond within 2 business days.`,
      ],
      list: [
        'A missing or incorrect timesheet entry — include the date and the Jira issue involved.',
        'Trouble connecting or disconnecting Jira or Warp — include which step failed.',
        'A request to delete your account or data.',
      ],
    },
    {
      heading: 'Before you write in',
      paragraphs: [
        'Check Settings first — most connection issues show up there as "Sign in again" and are fixed by reconnecting.',
      ],
    },
  ],
}
