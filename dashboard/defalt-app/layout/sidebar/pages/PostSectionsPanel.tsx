import { SectionsPanelBase, type SectionsPanelProps } from './SectionsPanelBase'

export type PostSectionsPanelProps = SectionsPanelProps

export function PostSectionsPanel(props: PostSectionsPanelProps) {
  return <SectionsPanelBase panelTitle="Post" allowTemplateAdd={false} {...props} />
}
