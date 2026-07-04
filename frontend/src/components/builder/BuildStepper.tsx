function BuildStepper({
  activeStepIndex,
  customizableSteps,
  onStepClick,
}: {
  activeStepIndex: number
  customizableSteps: any[]
  onStepClick: (stepIndex: number) => void
}) {
  return (
    <aside className="min-w-0 max-[980px]:order-2">
      <div className="sticky top-[104px] rounded-[3px] border border-[#dfe3e8] bg-white shadow-sm max-[980px]:static">
        <div className="border-b border-[#dfe3e8] px-5 py-4">
          <p className="text-[12px] font-semibold text-[#60656c]">List of customization</p>
        </div>
        <div className="grid">
          {customizableSteps.map((step, index) => {
            const isActive = index === activeStepIndex
            const isComplete = index < activeStepIndex

            return (
              <button
                className={`flex cursor-pointer items-center gap-3 border-b border-[#edf0f2] px-5 py-4 text-left transition last:border-b-0 hover:bg-[#f7f9fb] ${isActive ? 'bg-[#eef4ff] text-[#1c69d4]' : 'text-[#1f2328]'}`}
                key={step.id}
                onClick={() => onStepClick(index)}
                type="button"
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold ${isActive ? 'border-[#1c69d4] bg-[#1c69d4] text-white' : isComplete ? 'border-[#7b858f] bg-[#f5f6f7] text-[#1f2328]' : 'border-[#c9d0d8] text-[#60656c]'}`}>
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold">{step.label}</span>
                  <span className="block text-[12px] text-[#60656c]">{isActive ? 'Active' : isComplete ? 'Configured' : 'Pending'}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

export default BuildStepper
