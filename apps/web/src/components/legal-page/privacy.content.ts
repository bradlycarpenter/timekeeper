import { CONTACT_EMAIL, JURISDICTION, LEGAL_ENTITY, POSTAL_ADDRESS } from './legal-page.constants.ts'
import type { LegalContent } from './legal-page.types.ts'

export const PRIVACY_CONTENT: LegalContent = {
  title: 'Privacy policy',
  intro:
    'Timekeeper connects to your Jira board and your Warp timesheet so it can file the day’s entry for you. This policy explains what we collect to do that, where it lives, and how to remove it.',
  sections: [
    {
      heading: 'Information we collect',
      paragraphs: [
        'When you sign in with Microsoft, we store your name, email address, and profile image, plus a session token, the IP address and user agent of your sign-in, and timestamps.',
        `When you connect Jira, we store the Atlassian account identifier and the OAuth access and refresh tokens issued to us, under the scopes read:jira-user, read:jira-work, read:me and read:account. Those scopes let us read your accessible Jira sites, issues assigned to you (their key, ID and summary), the projects they belong to, and the status categories on your board — we do not write to Jira.`,
        'When you connect your Warp timesheet, we store the sign-in token Warp issues after you enter your Warp email and password once, so a later scheduled post can run without you being signed in to Timekeeper.',
        'When you set up a board link, we store the Warp task, client, cost code and default hours you chose, and the Jira project and status rules you mapped to them.',
        'Each time an entry is filed, we store the entry date, status, the hours and the exact text of the comment we posted to Warp, and any error if the post failed — this becomes your post history.',
      ],
    },
    {
      heading: 'Why we collect it',
      paragraphs: [
        'We use this information to authenticate you, to read the state of your Jira board, and to file a timesheet entry to Warp on your behalf that matches what you actually worked on.',
      ],
    },
    {
      heading: 'The scheduled post',
      paragraphs: [
        'Every weekday at 17:00 in Africa/Johannesburg (15:00 UTC), an automated job checks each board link you have set up and, if your Jira board shows qualifying activity, posts a timesheet entry to Warp using your stored connection — without you needing to be signed in at the time. This is the core function of the product, not an optional background task.',
      ],
    },
    {
      heading: 'Where it is stored',
      paragraphs: [
        'Data is stored in Cloudflare D1 (a SQL database) and Cloudflare KV (short-lived caches, such as your Jira site identifier, cached for about a day). Both run on Cloudflare’s infrastructure; we have not pinned them to a specific region, and Cloudflare determines physical location.',
      ],
    },
    {
      heading: 'Who it is disclosed to',
      paragraphs: [
        'Atlassian, so we can read your Jira data under the scopes above. Warp, so we can create the timesheet entry. Cloudflare, as the infrastructure provider hosting our database, cache and background jobs. We do not sell your data or use it for advertising.',
      ],
    },
    {
      heading: 'Security',
      paragraphs: [
        'Connections to Atlassian, Warp and our own servers use HTTPS in transit. Access to the database is restricted to the application itself.',
        'We are being direct about a known gap: the Warp sign-in token is not currently encrypted at rest in our database — it is stored as plain text, protected only by access controls, not by encryption. We are tracking this as an issue to fix and do not want to overstate the protection in place today.',
      ],
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'Session tokens expire automatically, and cached Jira lookups expire on their own. Everything else — your profile, your Jira and Warp connections, your board links, and your post history — is kept indefinitely. We do not currently run an automated job to delete old data.',
      ],
    },
    {
      heading: 'Your choices',
      paragraphs: [
        'You can disconnect Warp from Settings at any time, which deletes the stored Warp token. You can disconnect Jira from Settings, which removes the linked Atlassian account and its tokens.',
        `To delete your account entirely, or to have your board links and post history removed, contact us at ${CONTACT_EMAIL}. This is currently a manual process on our side, not a self-service action.`,
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
        `${LEGAL_ENTITY}, ${POSTAL_ADDRESS} (${JURISDICTION}). Email: ${CONTACT_EMAIL}.`,
      ],
    },
  ],
}
