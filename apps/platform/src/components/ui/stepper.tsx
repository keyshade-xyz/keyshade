import * as React from 'react'
import { createContext, useContext } from 'react'
import { CheckIcon, LoaderCircleIcon } from 'lucide-react'
import { Slot as SlotPrimitive } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

// Types
interface StepperContextValue {
  activeStep: number
  setActiveStep: (step: number) => void
  orientation: 'horizontal' | 'vertical'
}

interface StepItemContextValue {
  step: number
  state: StepState
  isDisabled: boolean
  isLoading: boolean
}

type StepState = 'active' | 'completed' | 'inactive' | 'loading'

// Contexts
const StepperContext = createContext<StepperContextValue | undefined>(undefined)
const StepItemContext = createContext<StepItemContextValue | undefined>(
  undefined
)

const useStepper = () => {
  const context = useContext(StepperContext)
  if (!context) {
    throw new Error('useStepper must be used within a Stepper')
  }
  return context
}

const useStepItem = () => {
  const context = useContext(StepItemContext)
  if (!context) {
    throw new Error('useStepItem must be used within a StepperItem')
  }
  return context
}

// Components
interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: number
  value?: number
  onValueChange?: (value: number) => void
  orientation?: 'horizontal' | 'vertical'
}

function Stepper({
  defaultValue = 0,
  value,
  onValueChange,
  orientation = 'horizontal',
  className,
  ...props
}: StepperProps) {
  const [activeStep, setInternalStep] = React.useState(defaultValue)

  const setActiveStep = React.useCallback(
    (step: number) => {
      if (value === undefined) {
        setInternalStep(step)
      }
      onValueChange?.(step)
    },
    [value, onValueChange]
  )

  const currentStep = value ?? activeStep

  return (
    <StepperContext.Provider
      value={{
        activeStep: currentStep,
        setActiveStep,
        orientation
      }}
    >
      <div
        className={cn(
          'group/stepper inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
          className
        )}
        data-orientation={orientation}
        data-slot="stepper"
        {...props}
      />
    </StepperContext.Provider>
  )
}

// StepperItem
interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number
  completed?: boolean
  disabled?: boolean
  loading?: boolean
}

function StepperItem({
  step,
  completed = false,
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { activeStep } = useStepper()

  const state: StepState =
    completed || step < activeStep
      ? 'completed'
      : activeStep === step
        ? 'active'
        : 'inactive'

  const isLoading = loading && step === activeStep

  return (
    <StepItemContext.Provider
      value={{ step, state, isDisabled: disabled, isLoading }}
    >
      <div
        className={cn(
          'group/step flex items-center group-data-[orientation=horizontal]/stepper:flex-row group-data-[orientation=vertical]/stepper:flex-col',
          className
        )}
        data-slot="stepper-item"
        data-state={state}
        {...(isLoading ? { 'data-loading': true } : {})}
        {...props}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  )
}

// StepperTrigger
interface StepperTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

function StepperTrigger({
  asChild = false,
  className,
  children,
  ...props
}: StepperTriggerProps) {
  const { setActiveStep } = useStepper()
  const { step, isDisabled } = useStepItem()

  if (asChild) {
    const Comp = SlotPrimitive
    return (
      <Comp className={className} data-slot="stepper-trigger">
        {children}
      </Comp>
    )
  }

  return (
    <button
      className={cn(
        'inline-flex items-center gap-3 rounded-full outline-none focus-visible:z-10 focus-visible:border-zinc-950 focus-visible:ring-[3px] focus-visible:ring-zinc-950/50 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50',
        className
      )}
      data-slot="stepper-trigger"
      disabled={isDisabled}
      onClick={() => setActiveStep(step)}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

// StepperIndicator
interface StepperIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

function StepperIndicator({
  asChild = false,
  className,
  children,
  ...props
}: StepperIndicatorProps) {
  const { state, step, isLoading } = useStepItem()

  return (
    <span
      className={cn(
        'relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-zinc-50 data-[state=active]:bg-zinc-100 data-[state=completed]:bg-zinc-100 data-[state=active]:text-black/80 data-[state=completed]:text-black/80',
        className
      )}
      data-slot="stepper-indicator"
      data-state={state}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          <span className="group-data-loading/step:scale-0 group-data-loading/step:opacity-0 group-data-loading/step:transition-none transition-all group-data-[state=completed]/step:scale-0 group-data-[state=completed]/step:opacity-0">
            {step}
          </span>
          <CheckIcon
            aria-hidden="true"
            className="absolute scale-0 text-black/80 opacity-0 transition-all group-data-[state=completed]/step:scale-100 group-data-[state=completed]/step:opacity-100"
            size={16}
          />
          {isLoading ? (
            <span className="absolute transition-all">
              <LoaderCircleIcon
                aria-hidden="true"
                className="animate-spin"
                size={14}
              />
            </span>
          ) : null}
        </>
      )}
    </span>
  )
}

// StepperTitle
function StepperTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-sm font-medium', className)}
      data-slot="stepper-title"
      {...props}
    >
      {children}
    </h3>
  )
}

// StepperDescription
function StepperDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-zinc-500 dark:text-zinc-400', className)}
      data-slot="stepper-description"
      {...props}
    />
  )
}

// StepperSeparator
function StepperSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mx-auto w-16 bg-zinc-600 group-data-[orientation=horizontal]/stepper:h-0.5 group-data-[orientation=vertical]/stepper:h-12 group-data-[orientation=vertical]/stepper:w-0.5 group-data-[orientation=horizontal]/stepper:min-w-8 group-data-[orientation=horizontal]/stepper:flex-1 group-data-[state=completed]/step:bg-zinc-100',
        className
      )}
      data-slot="stepper-separator"
      {...props}
    />
  )
}

export {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger
}
