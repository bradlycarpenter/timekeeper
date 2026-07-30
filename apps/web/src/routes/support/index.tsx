import { createFileRoute } from '@tanstack/react-router'
import { EFFECTIVE_DATE } from '#/components/legal-page/legal-page.constants.ts'
import { LegalPage } from '#/components/legal-page/legal-page.tsx'
import { SUPPORT_CONTENT } from '#/components/legal-page/support.content.ts'

export const Route = createFileRoute('/support/')({
  component: SupportScreen,
})

function SupportScreen() {
  return (
    <LegalPage.Root>
      <LegalPage.Title heading={SUPPORT_CONTENT.title} updated={EFFECTIVE_DATE} />
      <p className="text-[0.9375rem] leading-relaxed">{SUPPORT_CONTENT.intro}</p>
      {SUPPORT_CONTENT.sections.map((section) => (
        <LegalPage.Section key={section.heading} heading={section.heading}>
          <LegalPage.Body paragraphs={section.paragraphs} list={section.list} />
        </LegalPage.Section>
      ))}
    </LegalPage.Root>
  )
}
