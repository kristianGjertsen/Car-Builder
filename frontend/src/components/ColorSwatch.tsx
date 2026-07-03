type ColorSwatchProps = {
  color: string
  custom?: boolean
  className?: string
  fillClassName?: string
}

function getCustomPreviewBackground(color: string) {
  return `linear-gradient(135deg, #111 0 18%, transparent 18% 32%, #111 32% 50%, transparent 50% 68%, #111 68% 82%, transparent 82% 100%), ${color}`
}

function ColorSwatch({
  color,
  custom = false,
  className = 'h-12 w-12 rounded-full',
  fillClassName = 'inset-1 rounded-full',
}: ColorSwatchProps) {
  return (
    <span className={`relative grid shrink-0 place-items-center border border-black/15 ${className}`}>
      <span
        className={`absolute ${fillClassName}`}
        style={{
          background: custom ? getCustomPreviewBackground(color) : color,
        }}
      />
    </span>
  )
}

export default ColorSwatch
