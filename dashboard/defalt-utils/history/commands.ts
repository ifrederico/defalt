export type HistoryCommandScope = 'page' | 'global'

export type HistoryCommandMetadata = {
  label: string
}

export interface HistoryCommand {
  scope: HistoryCommandScope
  pageId?: string
  metadata: HistoryCommandMetadata
  execute: () => void
  undo: () => void
}

type BaseCommandOptions = {
  scope: HistoryCommandScope
  pageId?: string
  metadata: HistoryCommandMetadata
  apply: () => void
  revert: () => void
}

abstract class BaseHistoryCommand implements HistoryCommand {
  scope: HistoryCommandScope
  pageId?: string
  metadata: HistoryCommandMetadata
  private readonly applyFn: () => void
  private readonly revertFn: () => void

  constructor({ scope, pageId, metadata, apply, revert }: BaseCommandOptions) {
    this.scope = scope
    this.pageId = pageId
    this.metadata = metadata
    this.applyFn = apply
    this.revertFn = revert
  }

  execute() {
    this.applyFn()
  }

  undo() {
    this.revertFn()
  }
}

type StatefulCommandOptions = {
  scope: HistoryCommandScope
  pageId?: string
  label: string
  applyState: () => void
  revertState: () => void
  markDirty: () => void
}

class StatefulCommand extends BaseHistoryCommand {
  constructor({ scope, pageId, label, applyState, revertState, markDirty }: StatefulCommandOptions) {
    super({
      scope,
      pageId,
      metadata: { label },
      apply: () => {
        applyState()
        markDirty()
      },
      revert: () => {
        revertState()
        markDirty()
      }
    })
  }
}

export type ReorderCommandOptions = {
  pageId: string
  target: 'template' | 'footer'
  applyState: () => void
  revertState: () => void
  markDirty: () => void
}

export class ReorderCommand extends StatefulCommand {
  constructor({ pageId, target, applyState, revertState, markDirty }: ReorderCommandOptions) {
    super({
      scope: 'page',
      pageId,
      label: `Reorder ${target} sections`,
      applyState,
      revertState,
      markDirty
    })
  }
}

export type VisibilityCommandOptions = {
  pageId: string
  sectionId: string
  applyState: () => void
  revertState: () => void
  markDirty: () => void
}

export class VisibilityCommand extends StatefulCommand {
  constructor({ pageId, sectionId, applyState, revertState, markDirty }: VisibilityCommandOptions) {
    super({
      scope: 'page',
      pageId,
      label: `Toggle ${sectionId} visibility`,
      applyState,
      revertState,
      markDirty
    })
  }
}

export type SectionCommandOptions = {
  pageId: string
  label: string
  applyState: () => void
  revertState: () => void
  markDirty: () => void
}

export class AddSectionCommand extends StatefulCommand {
  constructor(options: SectionCommandOptions) {
    super({
      scope: 'page',
      pageId: options.pageId,
      label: `Add ${options.label}`,
      applyState: options.applyState,
      revertState: options.revertState,
      markDirty: options.markDirty
    })
  }
}

export class RemoveSectionCommand extends StatefulCommand {
  constructor(options: SectionCommandOptions) {
    super({
      scope: 'page',
      pageId: options.pageId,
      label: `Remove ${options.label}`,
      applyState: options.applyState,
      revertState: options.revertState,
      markDirty: options.markDirty
    })
  }
}

export class PaddingCommand extends StatefulCommand {
  constructor(options: SectionCommandOptions) {
    super({
      scope: 'page',
      pageId: options.pageId,
      label: options.label,
      applyState: options.applyState,
      revertState: options.revertState,
      markDirty: options.markDirty
    })
  }
}

export class MarginCommand extends StatefulCommand {
  constructor(options: SectionCommandOptions) {
    super({
      scope: 'page',
      pageId: options.pageId,
      label: options.label,
      applyState: options.applyState,
      revertState: options.revertState,
      markDirty: options.markDirty
    })
  }
}

export class CustomSectionCommand extends StatefulCommand {
  constructor(options: SectionCommandOptions) {
    super({
      scope: 'page',
      pageId: options.pageId,
      label: options.label,
      applyState: options.applyState,
      revertState: options.revertState,
      markDirty: options.markDirty
    })
  }
}

export type GlobalSettingCommandOptions = {
  label: string
  applyState: () => void
  revertState: () => void
  markDirty: () => void
}

export class GlobalSettingCommand extends StatefulCommand {
  constructor({ label, applyState, revertState, markDirty }: GlobalSettingCommandOptions) {
    super({
      scope: 'global',
      label,
      applyState,
      revertState,
      markDirty
    })
  }
}

export class HeaderCommand extends StatefulCommand {
  constructor({ label, applyState, revertState, markDirty }: GlobalSettingCommandOptions) {
    super({
      scope: 'global',
      label,
      applyState,
      revertState,
      markDirty
    })
  }
}

export type AnnouncementCommandOptions = GlobalSettingCommandOptions

export class AnnouncementCommand extends StatefulCommand {
  constructor({ label, applyState, revertState, markDirty }: AnnouncementCommandOptions) {
    super({
      scope: 'global',
      label,
      applyState,
      revertState,
      markDirty
    })
  }
}

export type BatchCommandOptions = {
  scope: HistoryCommandScope
  pageId?: string
  label: string
  commands: HistoryCommand[]
}

export class BatchCommand extends BaseHistoryCommand {
  constructor({ scope, pageId, label, commands }: BatchCommandOptions) {
    super({
      scope,
      pageId,
      metadata: { label },
      apply: () => {
        commands.forEach((command) => command.execute())
      },
      revert: () => {
        [...commands].reverse().forEach((command) => command.undo())
      }
    })
  }
}
