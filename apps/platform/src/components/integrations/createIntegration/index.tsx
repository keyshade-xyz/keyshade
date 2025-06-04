'use client'
import React, { useMemo } from 'react'
import { useAtom } from 'jotai'
import Link from 'next/link'
import { Integrations } from '@keyshade/common'
import { AddSVG } from '@public/svg/shared'
import IntegrationIcon from '../integrationIcon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { createIntegrationOpenAtom } from '@/store'

export default function CreateIntegration(): React.JSX.Element {
  const [isCreateIntegrationOpen, setIsCreateIntegrationOpen] = useAtom(
    createIntegrationOpenAtom
  )
  const handleToggel = () => {
    setIsCreateIntegrationOpen((prev) => !prev)
  }

  const integrations = useMemo(() => Object.values(Integrations), [])

  return (
    <Dialog onOpenChange={handleToggel} open={isCreateIntegrationOpen}>
      <DialogTrigger asChild>
        <Button>
          <AddSVG /> Add Integration
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[80vh] max-w-6xl flex-col gap-6 overflow-y-auto p-3">
        <DialogHeader className="border-b border-white/20 p-2 pb-6">
          <DialogTitle className="text-2xl font-bold">
            Integrate third-party services
          </DialogTitle>
          <p className="mt-2 text-white/50">
            Sync up your project&apos;s secrets, variables, and environment with
            third-party services with ease
          </p>
        </DialogHeader>
        <div className="grid grid-cols-9 gap-3">
          {integrations.map(({ name, type }) => (
            <Link
              href={`integrations?setup=${type}`}
              key={name}
              onClick={() => setIsCreateIntegrationOpen(false)}
            >
              <div className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-white/20 bg-white/5 p-4 transition-all duration-300 hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:shadow-md">
                <div className="mb-4 h-16 w-16">
                  <IntegrationIcon className="h-full w-full" type={type} />
                </div>
                <span className="text-lg font-medium text-white/60">
                  {name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
