import type { ReactNode } from 'react'

export type LegalPageRootProps = {
  children: ReactNode
}

export type LegalPageTitleProps = {
  heading: string
  updated: string
}

export type LegalPageSectionProps = {
  heading: string
  children: ReactNode
}

export type LegalPageBodyProps = {
  paragraphs: ReadonlyArray<string>
  list?: ReadonlyArray<string>
}

export type LegalSection = {
  heading: string
  paragraphs: ReadonlyArray<string>
  list?: ReadonlyArray<string>
}

export type LegalContent = {
  title: string
  intro: string
  sections: ReadonlyArray<LegalSection>
}
