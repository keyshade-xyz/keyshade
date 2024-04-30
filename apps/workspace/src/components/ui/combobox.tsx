'use client'

import * as React from 'react'
import { ChevronsUpDown } from 'lucide-react'
// import {Check} from 'lucide-react'
// import { cn } from '@/lib/utils'
// import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

const _frameworks = [
  {
    value: 'next.js',
    label: 'Next.js'
  },
  {
    value: 'sveltekit',
    label: 'SvelteKit'
  },
  {
    value: 'nuxt.js',
    label: 'Nuxt.js'
  },
  {
    value: 'remix',
    label: 'Remix'
  },
  {
    value: 'astro',
    label: 'Astro'
  }
]

export function Combobox(): React.JSX.Element {
  const [open, setOpen] = React.useState<boolean>(false)
  // const [value, setValue] = React.useState('')

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-controls="popover-content"
          aria-expanded={open}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-[#161819] px-[0.6875rem] py-[0.8125rem]"
          role="combobox"
          type="button"
        >
          {/* {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : 'Select framework...'} */}
          <div className="flex gap-x-[0.88rem]">
            <div className="flex aspect-square items-center rounded-[0.3125rem] bg-[#0B0D0F] p-[0.62rem] text-xl">
              🔥
            </div>
            <div className="flex flex-col items-start">
              <div className="text-lg text-white">Zenversee</div>
              <span className="text-xs text-white/55">100+ projects</span>
            </div>
          </div>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className=" p-0">
        <Command>
          <CommandInput placeholder="Search framework..." />
          <CommandEmpty>No framework found.</CommandEmpty>
          <CommandGroup>
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search Emoji</CommandItem>
            <CommandItem>Calculator</CommandItem>
          </CommandGroup>
          {/* <CommandGroup>
            {frameworks
              ? frameworks.map((framework) => (
                  <CommandItem
                    key={framework.value}
                    onSelect={(currentValue) => {
                      console.log('currentValue:', currentValue)
                      console.log('value:', value)
                      setValue(currentValue === value ? '' : currentValue)
                      setOpen(false)
                    }}
                    value={framework.value}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === framework.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {framework.label}
                  </CommandItem>
                ))
              : null}
          </CommandGroup> */}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
