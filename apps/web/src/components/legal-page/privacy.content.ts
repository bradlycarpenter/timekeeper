import { CONTACT_EMAIL, JURISDICTION, LEGAL_ENTITY } from './legal-page.constants.ts'
import type { LegalContent } from './legal-page.types.ts'

export const PRIVACY_CONTENT: LegalContent = {
  title: 'Privacy policy',
  intro:
    'Timekeeper connects to your Jira board and your Warp timesheet so it can file the day’s entry for you. This policy explains what we collect to do that, where it lives, and how to remove it.',
  sections: [
    {
      heading: 'Information we collect',
      paragraphs: [
        'When you sign in with Microsoft, we receive your name, email address and profile image, and we record sign-in details needed to keep your session secure.',
        'When you connect Jira, we store the identifier of your Atlassian account and the access credentials Atlassian issues to us. You grant read-only access, which lets us see your Jira sites, the issues assigned to you, the projects they belong to, and the statuses on your board. We never write to Jira.',
        'When you connect your Warp timesheet, we store the credential Warp issues after you sign in once, so a later scheduled entry can be filed without you being signed in to Timekeeper.',
        'When you set up a board link, we store the Warp task, client, cost code and default hours you chose, and the Jira project and status rules you mapped to them.',
        'Each time an entry is filed, we store the date, the outcome, the hours and the text of the entry we posted to Warp. This becomes your entry history.',
      ],
    },
    {
      heading: 'Why we collect it',
      paragraphs: [
        'We use this information to authenticate you, to read the state of your Jira board, and to file a timesheet entry to Warp on your behalf that matches what you actually worked on.',
      ],
    },
    {
      heading: 'The scheduled entry',
      paragraphs: [
        'At the end of each working day, Timekeeper checks the board links you have set up and, if your Jira board shows qualifying activity, files a timesheet entry to Warp using your stored connections — without you needing to be signed in at the time. This is the core function of the product, not an optional background task.',
      ],
    },
    {
      heading: 'Where it is stored',
      paragraphs: [
        'Your data is held with established third-party cloud infrastructure providers under their own security and privacy commitments. It may be processed or stored outside the country you use Timekeeper from.',
      ],
    },
    {
      heading: 'Who it is disclosed to',
      paragraphs: [
        'Atlassian, so we can read your Jira data under the read-only access you granted. Warp, so we can create the timesheet entry. Our infrastructure providers, who host the service on our behalf. We do not sell your data or use it for advertising.',
      ],
    },
    {
      heading: 'Security',
      paragraphs: [
        'Traffic between you, Timekeeper, Atlassian and Warp travels over HTTPS. Access to your stored data is limited to the application itself and to the people who operate it.',
        'No service can promise perfect security. If you believe your account or a connection has been compromised, disconnect it in Settings, revoke Timekeeper’s access from the provider, and contact us.',
      ],
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'Sign-in sessions and cached lookups expire on their own. Your profile, your connections, your board links and your entry history are kept for as long as your account exists, so that your history stays available to you. You can ask us to delete any of it at any time.',
      ],
    },
    {
      heading: 'Your choices',
      paragraphs: [
        `You can disconnect Warp or Jira from Settings at any time, which removes the stored credential for that connection. You can also revoke Timekeeper’s access from your Atlassian account settings, which stops us reading your Jira data immediately.`,
        `To delete your account entirely, or to have your board links and entry history removed, contact us at ${CONTACT_EMAIL} and we will action it.`,
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'If how we handle your data changes materially, we will update this page and the date below.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        `Timekeeper is operated by ${LEGAL_ENTITY}, based in ${JURISDICTION}. Email: ${CONTACT_EMAIL}.`,
      ],
    },
  ],
}
