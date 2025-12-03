import { SectionsPanelBase, type SectionsPanelProps } from './SectionsPanelBase'

export type AboutSectionsPanelProps = SectionsPanelProps

export function AboutSectionsPanel(props: AboutSectionsPanelProps) {
  return <SectionsPanelBase panelTitle="About page" allowTemplateAdd={false} {...props} />
}
