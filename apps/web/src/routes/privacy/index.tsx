import { createFileRoute } from '@tanstack/react-router'
import { EFFECTIVE_DATE } from '#/components/legal-page/legal-page.constants.ts'
import { LegalPage } from '#/components/legal-page/legal-page.tsx'
import { PRIVACY_CONTENT } from '#/components/legal-page/privacy.content.ts'

export const Route = createFileRoute('/privacy/')({
  component: PrivacyScreen,
})

function PrivacyScreen() {
  return (
    <LegalPage.Root>
      <LegalPage.Title heading={PRIVACY_CONTENT.title} updated={EFFECTIVE_DATE} />
      <p className="text-[0.9375rem] leading-relaxed">{PRIVACY_CONTENT.intro}</p>
      {PRIVACY_CONTENT.sections.map((section) => (
        <LegalPage.Section key={section.heading} heading={section.heading}>
          <LegalPage.Body paragraphs={section.paragraphs} list={section.list} />
        </LegalPage.Section>
      ))}
    </LegalPage.Root>
  )
}
