import { createFileRoute } from '@tanstack/react-router'
import { EFFECTIVE_DATE } from '#/components/legal-page/legal-page.constants.ts'
import { LegalPage } from '#/components/legal-page/legal-page.tsx'
import { TERMS_CONTENT } from '#/components/legal-page/terms.content.ts'

export const Route = createFileRoute('/terms/')({
  component: TermsScreen,
})

function TermsScreen() {
  return (
    <LegalPage.Root>
      <LegalPage.Title heading={TERMS_CONTENT.title} updated={EFFECTIVE_DATE} />
      <p className="text-[0.9375rem] leading-relaxed">{TERMS_CONTENT.intro}</p>
      {TERMS_CONTENT.sections.map((section) => (
        <LegalPage.Section key={section.heading} heading={section.heading}>
          <LegalPage.Body paragraphs={section.paragraphs} list={section.list} />
        </LegalPage.Section>
      ))}
    </LegalPage.Root>
  )
}
