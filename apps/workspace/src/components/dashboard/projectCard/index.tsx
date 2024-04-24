'use client'
import { ThreeDotOptionSVG } from '@public/svg/shared'
import { ConfigSVG, EnvironmentSVG, SecretSVG } from '@public/svg/dashboard'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger
} from '@/components/ui/menubar'

function ProjectCard(): React.JSX.Element {
  return (
    <div className="flex h-[7rem] max-w-[30.25rem] justify-between rounded-xl bg-white/5 px-5 py-4 shadow-lg hover:bg-white/10">
      <div className="flex items-center gap-x-5">
        <div className="aspect-square h-14 w-14 rounded-full bg-white/35" />
        <div>
          <div className="font-semibold">Project Sell the boat</div>
          <span className="text-xs font-semibold text-white/60">
            This a description for your project{' '}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <Menubar className="cursor-pointer border-none bg-transparent">
          <MenubarMenu>
            <MenubarTrigger className="cursor-pointer">
              <ThreeDotOptionSVG />
            </MenubarTrigger>
            <MenubarContent className="border-white/20 bg-[#2A2C2E] text-white">
              <MenubarItem>New Tab</MenubarItem>
              <MenubarItem>New Window</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Share</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Print</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <div className="grid grid-cols-3 gap-x-3">
          <div className="flex items-center gap-x-1">
            <EnvironmentSVG />2
          </div>
          <div className="flex items-center gap-x-1">
            <ConfigSVG />
            10
          </div>
          <div className="flex items-center gap-x-1">
            <SecretSVG />5
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
