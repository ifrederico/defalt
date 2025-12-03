import { SectionsPanelBase, type SectionsPanelProps } from './SectionsPanelBase'

export type HomepageSectionsPanelProps = SectionsPanelProps

export function HomepageSectionsPanel(props: HomepageSectionsPanelProps) {
  return <SectionsPanelBase panelTitle="Homepage" {...props} />
}
