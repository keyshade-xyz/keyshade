import type { GetAllVariablesOfProjectResponse } from '@keyshade/schema'
import { MessageSVG } from '@public/svg/shared'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useSetAtom } from 'jotai'
import dayjs from 'dayjs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  deleteVariableOpenAtom,
  editVariableOpenAtom,
  selectedVariableAtom
} from '@/store'

export default function VariableCard(
  variableData: GetAllVariablesOfProjectResponse['items'][number]
) {
  const setSelectedVariable = useSetAtom(selectedVariableAtom)
  const setIsEditVariableOpen = useSetAtom(editVariableOpenAtom)
  const setIsDeleteVariableOpen = useSetAtom(deleteVariableOpenAtom)

  const { variable, values } = variableData

  const handleEditClick = () => {
    setSelectedVariable(variableData)
    setIsEditVariableOpen(true)
  }

  const handleDeleteClick = () => {
    setSelectedVariable(variableData)
    setIsDeleteVariableOpen(true)
  }

  // Holds the currently open section ID
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  //Environments table toggle logic
  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <ContextMenu key={variable.id}>
      <ContextMenuTrigger className="w-full">
        <Collapsible
          className="w-full"
          key={variable.id}
          onOpenChange={() => toggleSection(variable.id)}
          open={openSections.has(variable.id)}
        >
          <CollapsibleTrigger
            className={`flex h-[6.75rem] w-full items-center justify-between gap-24 ${openSections.has(variable.id) ? 'rounded-t-xl' : 'rounded-xl'} bg-[#232424] px-4 py-2 text-left`}
          >
            <div className="flex h-[2.375rem] items-center justify-center gap-4">
              <span className="h-[2.375rem] text-2xl font-normal text-zinc-100">
                {variable.name}
              </span>
              {variable.note ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <MessageSVG height="40" width="40" />
                    </TooltipTrigger>
                    <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                      <p>{variable.note}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
            <div className="flex h-[6.5rem] w-[18.188rem] items-center justify-center gap-x-[3.125rem]">
              <div className="flex h-[2.063rem] w-[13.563rem] items-center justify-center gap-x-3">
                <div className="flex h-[2.063rem] w-[7.438rem] items-center justify-center text-base font-normal text-white text-opacity-50">
                  {dayjs(variable.updatedAt).toNow(true)} ago by{' '}
                </div>
                <div className="flex h-[2.063rem] w-[5.375rem] items-center justify-center gap-x-[0.375rem]">
                  <div className="flex h-[2.063rem] w-[3.5rem] items-center justify-center text-base font-medium text-white">
                    {variable.lastUpdatedBy.name.split(' ')[0]}
                  </div>
                  <Avatar className="h-6 w-6">
                    <AvatarImage />
                    <AvatarFallback>
                      {variable.lastUpdatedBy.name.charAt(0).toUpperCase() +
                        variable.lastUpdatedBy.name.slice(1, 2).toLowerCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <ChevronDown
                className={`h-[1.5rem] w-[1.5rem] text-zinc-400 transition-transform ${openSections.has(variable.id) ? 'rotate-180' : ''}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="h-full w-full gap-y-24 rounded-b-lg bg-[#232424] p-4">
            <Table className="h-full w-full">
              <TableHeader className="h-[3.125rem] w-full">
                <TableRow className="h-[3.125rem] w-full hover:bg-[#232424]">
                  <TableHead className="h-full w-[10.25rem] border-2 border-white/30 text-base font-bold text-white">
                    Environment
                  </TableHead>
                  <TableHead className="h-full border-2 border-white/30 text-base font-normal text-white">
                    Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {values.map((env) => (
                  <TableRow
                    className="h-[3.125rem] w-full hover:cursor-pointer hover:bg-[#232424]"
                    key={env.environment.id}
                  >
                    <TableCell className="h-full w-[10.25rem] border-2 border-white/30 text-base font-bold text-white">
                      {env.environment.name}
                    </TableCell>
                    <TableCell className="h-full border-2 border-white/30 text-base font-normal text-white">
                      {env.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CollapsibleContent>
        </Collapsible>
      </ContextMenuTrigger>
      <ContextMenuContent className="flex h-[6.375rem] w-[15.938rem] flex-col items-center justify-center rounded-lg bg-[#3F3F46]">
        <ContextMenuItem className="h-[33%] w-[15.938rem] border-b-[0.025rem] border-white/65 text-xs font-semibold tracking-wide">
          Show Version History
        </ContextMenuItem>
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide"
          onSelect={handleEditClick}
        >
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide"
          onSelect={handleDeleteClick}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
