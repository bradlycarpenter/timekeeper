import { CONTACT_EMAIL, JURISDICTION, LEGAL_ENTITY } from './legal-page.constants.ts'
import type { LegalContent } from './legal-page.types.ts'

export const TERMS_CONTENT: LegalContent = {
  title: 'Terms of service',
  intro:
    'Timekeeper is a small tool that reads your Jira board and files timesheet entries to Warp on your behalf. These terms are short on purpose — read the privacy policy for how your data is handled.',
  sections: [
    {
      heading: 'The service',
      paragraphs: [
        'Timekeeper connects to your Jira account and your Warp timesheet, and on a schedule, files a timesheet entry to Warp based on the activity it observes on your Jira board.',
      ],
    },
    {
      heading: 'You act through us',
      paragraphs: [
        'When Timekeeper posts an entry, it is acting on your behalf using the connections you set up. You are responsible for reviewing your board links and rules, and for the accuracy of any hours and description that end up on your timesheet — Timekeeper drafts the entry, but you remain accountable for what is filed.',
      ],
    },
    {
      heading: 'Your account',
      paragraphs: [
        'You sign in with a Microsoft account and separately connect Jira and Warp. You are responsible for keeping those accounts secure and for disconnecting them if you no longer want Timekeeper acting on your behalf.',
      ],
    },
    {
      heading: 'Acceptable use',
      paragraphs: [
        'Use Timekeeper only for your own timesheet. Do not attempt to use it to access another person’s Jira or Warp account, or to interfere with the service.',
      ],
    },
    {
      heading: 'No warranty',
      paragraphs: [
        'Timekeeper is provided "as is". We do not guarantee that a scheduled post will always run, that it will always correctly reflect your Jira activity, or that the service will be uninterrupted or error-free.',
      ],
    },
    {
      heading: 'Limitation of liability',
      paragraphs: [
        `To the extent permitted by law in ${JURISDICTION}, ${LEGAL_ENTITY} is not liable for any indirect, incidental, or consequential loss arising from your use of Timekeeper, including an incorrect or missed timesheet entry.`,
      ],
    },
    {
      heading: 'Termination',
      paragraphs: [
        'You may stop using Timekeeper at any time by disconnecting your Warp and Jira connections in Settings and no longer signing in. We may suspend or end access to the service, including for misuse, with notice where practical.',
        `To close your account entirely, contact ${CONTACT_EMAIL}.`,
      ],
    },
    {
      heading: 'Changes to these terms',
      paragraphs: [
        'If these terms change materially, we will update this page and the date below.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [`${LEGAL_ENTITY}. Email: ${CONTACT_EMAIL}.`],
    },
  ],
}
