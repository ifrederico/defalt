type TooltipProps = {
  label: string
  shortcutKeys?: string[]
}

export function Tooltip({ label, shortcutKeys }: TooltipProps) {
  return (
    <div
      className={`invisible absolute -top-8 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-md bg-inverse py-1 font-sans text-[10px] font-medium text-white group-hover:visible ${
        shortcutKeys ? 'pl-[1rem] pr-1' : 'px-[1rem]'
      }`}
    >
      <span>{label}</span>
      {shortcutKeys?.map((key) => (
        <div key={key} className="rounded bg-inverse px-2 text-[10px] text-white">
          {key}
        </div>
      ))}
    </div>
  )
}
