import ColorSwatch from '../components/ColorSwatch'

type OrderLine = {
  id: string
  label: string
  value: string
  price: number
  color?: string
  customColor?: boolean
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('nb-NO').format(price)
}

function OrderSummary({
  lines,
  total,
}: {
  lines: OrderLine[]
  total: number
}) {
  return (
    <div className="grid gap-3">
      <div className="rounded-[3px] border border-[#dfe3e8] bg-[#f8f9fa] p-4">
        <p className="text-[12px] font-semibold text-[#60656c]">Order total</p>
        <p className="mt-1 text-[30px] leading-none font-semibold text-[#1f2328]">{formatPrice(total)} kr</p>
      </div>

      <div className="grid gap-2">
        {lines.map((line) => (
          <div className="rounded-[3px] border border-[#dfe3e8] bg-white px-3 py-3" key={line.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {line.color && (
                  <ColorSwatch
                    className="mt-0.5 h-9 w-9 rounded-[3px]"
                    color={line.color}
                    custom={line.customColor}
                    fillClassName="inset-[4px] rounded-[2px]"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#60656c]">{line.label}</p>
                  <p className="mt-1 text-[14px] leading-tight font-semibold text-[#1f2328]">{line.value}</p>
                </div>
              </div>
              <p className="shrink-0 text-[13px] font-semibold text-[#1f2328]">{formatPrice(line.price)} kr</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OrderSummary
