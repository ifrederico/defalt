import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { PanelLeftOpen, X } from 'lucide-react'

export type CodePanelProps = {
  packageJson: string
  onPackageJsonChange: (value: string) => void
  sidebarExpanded: boolean
  onToggleSidebar: () => void
}

export function CodePanel({
  packageJson,
  onPackageJsonChange,
  sidebarExpanded,
  onToggleSidebar
}: CodePanelProps) {
  return (
    <>
      <div className="h-12 px-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">package.json</h2>
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-secondary hover:text-foreground hover:bg-subtle rounded transition-colors"
          title={sidebarExpanded ? 'Collapse' : 'Expand'}
          type="button"
        >
          {sidebarExpanded ? <X size={16} strokeWidth={1.5} /> : <PanelLeftOpen size={16} strokeWidth={1.5} />}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <CodeMirror
          value={packageJson}
          onChange={onPackageJsonChange}
          extensions={[json()]}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
          }}
          className="border border-border-strong rounded overflow-hidden text-xs [&_.cm-activeLine]:bg-transparent [&_.cm-activeLineGutter]:bg-transparent"
          style={{ fontSize: '12px' }}
          height="100%"
        />
      </div>
    </>
  )
}
