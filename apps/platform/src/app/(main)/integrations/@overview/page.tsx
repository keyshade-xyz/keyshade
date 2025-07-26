import React from 'react'
import IntegrationServices from '@/components/integrations/integrationServices'

function AllAvailableIntegrations() {
  return (
    <div className="flex flex-col gap-y-10">
      <div className="flex flex-col gap-y-8 ">
        <div>
          <h1 className="text-[1.75rem] font-semibold ">
            Create a new integration
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Supercharge your workflow and connect the tools you use everyday.
          </p>
        </div>

        <IntegrationServices />
      </div>
    </div>
  )
}

export default AllAvailableIntegrations
