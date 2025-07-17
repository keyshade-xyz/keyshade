'use client'
import React from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import IntegrationList from '@/components/integrations/integrationList'
import { Button } from '@/components/ui/button'

function IntegrationsPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-y-10">
      <div className="flex w-full justify-between">
        <div>
          <h1 className="text-[1.75rem] font-semibold ">All Integrations</h1>
          <p className="mt-2 text-sm text-white/60">
            Supercharge your workflow and connect the tools you use everyday.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/integrations?tab=overview">
            <Button className="flex gap-2 text-white" variant="default">
              <Plus />
              Add Integration
            </Button>
          </Link>
        </div>
      </div>

      {/* Integrations list */}
      <IntegrationList />
    </div>
  )
}

export default IntegrationsPage
