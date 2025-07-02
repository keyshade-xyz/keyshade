import React, { useState, useEffect } from 'react'
import type { Project, ProjectAccessLevelEnum } from '@keyshade/schema'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

interface AccessLevelProps {
  accessLevel: ProjectAccessLevelEnum
  projectSlug: Project['slug']
}

function ConfigAccessLevel({
  accessLevel,
  projectSlug
}: AccessLevelProps): React.JSX.Element {
  const [selectedLevel, setSelectedLevel] =
    useState<ProjectAccessLevelEnum>(accessLevel)

  useEffect(() => {
    setSelectedLevel(accessLevel)
  }, [accessLevel])

  const updateAccessLevel = useHttp(() => {
    return ControllerInstance.getInstance().projectController.updateProject({
      projectSlug,
      accessLevel: selectedLevel
    })
  })
  const handleUpdateAccessLevel = async () => {
    const { success } = await updateAccessLevel()
    if (success) {
      toast.success('Access level updated successfully!')
    }
  }

  return (
    <div>
      <RadioGroup
        className="gap-3 py-4"
        onValueChange={(value) =>
          setSelectedLevel(value as ProjectAccessLevelEnum)
        }
        value={selectedLevel}
      >
        <div
          className="flex cursor-pointer items-start gap-2 rounded-lg p-2 transition-colors duration-200 hover:bg-white/5"
          onClick={() => setSelectedLevel('PRIVATE')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSelectedLevel('PRIVATE')
            }
          }}
          role="button"
          tabIndex={0}
        >
          <RadioGroupItem id="private" value="PRIVATE" />
          <div className="flex flex-col gap-1">
            <Label
              className="cursor-pointer font-medium text-white"
              htmlFor="private"
            >
              Private
            </Label>
            <p className="text-sm text-white/60">
              Only you and users with assigned roles can access this project.
            </p>
          </div>
        </div>
        <div
          className="flex cursor-pointer items-start gap-2 rounded-lg p-2 transition-colors duration-200 hover:bg-white/5"
          onClick={() => setSelectedLevel('INTERNAL')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSelectedLevel('INTERNAL')
            }
          }}
          role="button"
          tabIndex={0}
        >
          <RadioGroupItem id="internal" value="INTERNAL" />
          <div className="flex flex-col gap-1">
            <Label
              className="cursor-pointer font-medium text-white"
              htmlFor="internal"
            >
              Internal
            </Label>
            <p className="text-sm text-white/60">
              Everyone in your workspace can access this project.
            </p>
          </div>
        </div>
        <div
          className="flex cursor-pointer items-start gap-2 rounded-lg p-2 transition-colors duration-200 hover:bg-white/5"
          onClick={() => setSelectedLevel('GLOBAL')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSelectedLevel('GLOBAL')
            }
          }}
          role="button"
          tabIndex={0}
        >
          <RadioGroupItem id="global" value="GLOBAL" />
          <div className="flex flex-col gap-1">
            <Label
              className="cursor-pointer font-medium text-white"
              htmlFor="global"
            >
              Global
            </Label>
            <p className="text-sm text-white/60">
              Anyone with the link (or via API) can access the project globally.
            </p>
          </div>
        </div>
      </RadioGroup>

      <Button
        className="mt-0"
        onClick={handleUpdateAccessLevel}
        variant="secondary"
      >
        Save
      </Button>
    </div>
  )
}

export default ConfigAccessLevel
