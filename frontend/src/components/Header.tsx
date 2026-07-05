type HeaderAction = {
  label: string
  onClick: () => void
}

function Header({
  action,
  metricLabel,
  metricValue,
  onLogoClick,
  secondaryAction,
  sticky = false,
  subtitle,
  title,
}: {
  action?: HeaderAction
  metricLabel?: string
  metricValue?: string
  onLogoClick?: () => void
  secondaryAction?: HeaderAction
  sticky?: boolean
  subtitle: string
  title: string
}) {
  const LogoElement = onLogoClick ? 'button' : 'div'

  return (
    <header className={`${sticky ? 'sticky top-0' : ''} z-50 border-b border-[#e2e4e8] bg-white/95 shadow-sm backdrop-blur max-[760px]:px-4`}>
      <div className="h-1 bg-[linear-gradient(90deg,#1c69d4_0_34%,#ffffff_34%_66%,#1f2328_66%_100%)]" />
      <div className="flex min-h-[68px] items-center justify-between gap-5 px-6 py-3 max-[760px]:px-0">
        <div className="flex min-w-0 items-center gap-4">
          <LogoElement
            aria-label={onLogoClick ? 'Go back' : undefined}
            className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#aeb6c0] bg-white shadow-sm"
            onClick={onLogoClick}
            type={onLogoClick ? 'button' : undefined}
          >
            <div className="absolute inset-[5px] overflow-hidden border-1 border-[#aeb6c0] rounded-full">
              <div className="absolute top-0 left-0 h-1/2 w-1/2 bg-[#1c69d4]" />
              <div className="absolute top-0 right-0 h-1/2 w-1/2 bg-white" />
              <div className="absolute bottom-0 left-0 h-1/2 w-1/2 bg-[#ffffff]" />
              <div className="absolute right-0 bottom-0 h-1/2 w-1/2 bg-[#000000]" />
            </div>
          </LogoElement>

          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-[22px] leading-tight font-semibold text-[#1f2328] max-[760px]:text-[18px]">{title}</h1>
              <span className="hidden rounded-full border border-[#dfe3e8] px-2.5 py-1 text-[11px] font-semibold text-[#60656c] sm:inline-flex">
                Configurator
              </span>
            </div>
            <p className="text-[13px] font-semibold text-[#60656c]">{subtitle}</p>
          </div>
        </div>

        {(metricLabel || secondaryAction || action) && (
          <div className="flex shrink-0 items-center gap-4">
            {metricLabel && (
              <div className="text-right">
                <p className="text-[12px] text-[#60656c]">{metricLabel}</p>
                <p className="text-[18px] leading-tight font-semibold text-[#1f2328]">{metricValue}</p>
              </div>
            )}
            {secondaryAction && (
              <button
                className="h-11 cursor-pointer rounded-[3px] border border-[#c9d0d8] bg-white px-5 text-[15px] font-semibold text-[#1f2328] shadow-sm transition hover:border-[#1c69d4] max-[520px]:px-3"
                onClick={secondaryAction.onClick}
                type="button"
              >
                {secondaryAction.label}
              </button>
            )}
            {action && (
              <button
                className="h-11 cursor-pointer rounded-[3px] bg-[#1c69d4] px-6 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#1654aa] max-[520px]:px-4"
                onClick={action.onClick}
                type="button"
              >
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
