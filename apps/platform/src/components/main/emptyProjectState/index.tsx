import { useSetAtom } from 'jotai'
import React from 'react'
import { AddSVG } from '@public/svg/shared'
import Image from 'next/image'
import { EmptyFolderPNG } from '@public/raster/dashboard'
import { createProjectOpenAtom } from '@/store'
import { Button } from '@/components/ui/button'
import { GeistSansFont } from '@/fonts'

export default function EmptyProjectsState() {
  const setIsCreateProjectDialogOpen = useSetAtom(createProjectOpenAtom)
  return (
    <div
      className={`${GeistSansFont.className} mt-[10vh] flex h-[40vh] flex-col items-center justify-center gap-y-4`}
    >
      <Image
        alt="No Projects"
        draggable={false}
        height={150}
        placeholder="blur"
        priority
        src={EmptyFolderPNG}
        width={150}
      />
      <div className=" flex flex-col items-center gap-y-2.5">
        <div className="text-2xl ">Start your First Project</div>
        <div className="text-base text-neutral-500">
          Create a project and start storing your data
        </div>
      </div>
      <Button
        onClick={() => setIsCreateProjectDialogOpen(true)}
        variant="primary"
      >
        <AddSVG />
        Create project
      </Button>
    </div>
  )
}
