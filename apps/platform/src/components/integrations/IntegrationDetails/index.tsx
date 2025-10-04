import React, { useCallback } from 'react'
import type { Integration } from '@keyshade/schema'
import { useSetAtom } from 'jotai'
import { EditTwoSVG, TrashWhiteSVG } from '@public/svg/shared'
import IntegrationIcon from '../integrationIcon'
import { formatDate, formatText } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import AvatarComponent from '@/components/common/avatar'
import CopyToClipboard from '@/components/common/copy-to-clipboard'
import { deleteIntegrationOpenAtom, editIntegrationOpenAtom } from '@/store'
import Visible from '@/components/common/visible'

interface IntegrationDetailsProps {
  selectedIntegration: Integration
}

function IntegrationDetails({ selectedIntegration }: IntegrationDetailsProps) {
  const setIsEditIntegrationOpen = useSetAtom(editIntegrationOpenAtom)
  const setIsDeleteIntegrationOpen = useSetAtom(deleteIntegrationOpenAtom)

  const isAuthorizedToUpdate = selectedIntegration.entitlements.canUpdate
  const isAuthorizedToDelete = selectedIntegration.entitlements.canDelete

  const handleEditIntegration = useCallback(() => {
    setIsEditIntegrationOpen(true)
  }, [setIsEditIntegrationOpen])

  const handleDeleteIntegration = useCallback(() => {
    setIsDeleteIntegrationOpen(true)
  }, [setIsDeleteIntegrationOpen])

  const lastUpdatedTime = formatDate(
    selectedIntegration.updatedAt || selectedIntegration.createdAt
  )

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <IntegrationIcon
            className="h-14 w-14 p-2"
            type={selectedIntegration.type}
          />
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-white">
              {selectedIntegration.name}
            </h1>
            <span className="text-sm text-white/60">
              {formatText(selectedIntegration.type)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
            disabled={!isAuthorizedToDelete}
            onClick={handleDeleteIntegration}
          >
            <TrashWhiteSVG />
          </Button>
          <Button
            className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
            disabled={!isAuthorizedToUpdate}
            onClick={handleEditIntegration}
          >
            <EditTwoSVG className="h-5 w-5 text-white/70 hover:text-white" />
          </Button>
        </div>
      </div>
      <div className="flex justify-between border-t border-white/10 pt-4">
        <div className="mr-2 flex w-3/4 items-center gap-3">
          <Visible if={Boolean(selectedIntegration.lastUpdatedBy)}>
            <div className="flex items-center gap-2">
              <AvatarComponent
                name={selectedIntegration.lastUpdatedBy.name || 'Unknown User'}
                profilePictureUrl={
                  selectedIntegration.lastUpdatedBy.profilePictureUrl || ''
                }
              />
              <div className="flex text-sm text-white/70">
                <div>
                  Last updated by &nbsp;
                  <span className="font-semibold text-white">
                    {selectedIntegration.lastUpdatedBy.name || 'Unknown User'}
                  </span>
                  &nbsp;{lastUpdatedTime}
                </div>
              </div>
            </div>
          </Visible>
        </div>
        <div className="flex w-1/4 items-center justify-end">
          <CopyToClipboard text={selectedIntegration.slug} />
        </div>
      </div>
    </div>
  )
}

export default IntegrationDetails
