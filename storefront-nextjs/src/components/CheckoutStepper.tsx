'use client'

import { Check } from 'lucide-react'

interface CheckoutStepperProps {
  currentStep: number
}

const steps = [
  { number: 1, label: 'Endereço' },
  { number: 2, label: 'Envio' },
  { number: 3, label: 'Pagamento' },
  { number: 4, label: 'Confirmação' },
]

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-12">
      {/* Desktop Version */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number
          const isCurrent = currentStep === step.number
          const isUpcoming = currentStep < step.number

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-medium text-[17px] transition-all duration-300
                    ${isCompleted ? 'bg-blue-600 text-white' : ''}
                    ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                    ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" strokeWidth={2.5} />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`
                    mt-3 text-sm font-medium transition-colors whitespace-nowrap
                    ${isCurrent ? 'text-gray-900' : 'text-gray-500'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-4 transition-all duration-300
                    ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile Version */}
      <div className="md:hidden">
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step Info */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-sm text-gray-500">Passo {currentStep} de {steps.length}</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">
              {steps[currentStep - 1].label}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`
                  w-2 h-2 rounded-full transition-all
                  ${currentStep >= step.number ? 'bg-blue-600' : 'bg-gray-300'}
                `}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

