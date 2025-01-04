'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  ClientResponse,
  GetAllVariablesOfProjectResponse,
  Project
} from '@keyshade/schema'
import { FolderSVG } from '@public/svg/dashboard'
import { MessageSVG, TrashSVG } from '@public/svg/shared'
import { ChevronDown } from 'lucide-react'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import ControllerInstance from '@/lib/controller-instance'
import ConfirmDelete from '@/components/ui/confirm-delete'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'

interface VariablePageProps {
  currentProject: Project | undefined
}

function VariablePage({
  currentProject
}: VariablePageProps): React.JSX.Element {
  const [allVariables, setAllVariables] = useState<
    GetAllVariablesOfProjectResponse['items']
  >([])
  // Holds the currently open section ID
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [selectedVariableSlug, setSelectedVariableSlug] = useState<string | null>(null)

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

  const openDeleteDialog = (variableSlug: string) => {
    setIsDeleteDialogOpen(true)
    setSelectedVariableSlug(variableSlug)
  }

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setSelectedVariableSlug(null)
  }

  useEffect(() => {
    const getAllVariables = async () => {
      if (!currentProject) {
        return
      }

      const {
        success,
        error,
        data
      }: ClientResponse<GetAllVariablesOfProjectResponse> =
        await ControllerInstance.getInstance().variableController.getAllVariablesOfProject(
          { projectSlug: currentProject.slug },
          {}
        )

      if (success && data) {
        setAllVariables(data.items)
      } else {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      }
    }

    getAllVariables()
  }, [currentProject, allVariables])

  return (
    <div className={` flex h-full w-full justify-center ${isDeleteDialogOpen ? "inert" : "" } `}>
      {/* Showing this when there are no variables present */}
      {allVariables.length === 0 ? (
        <div className="flex h-[23.75rem] w-[30.25rem] flex-col items-center justify-center gap-y-8">
          <FolderSVG width="150" />

          <div className="flex h-[5rem] w-[30.25rem] flex-col items-center justify-center gap-4">
            <p className="h-[2.5rem] w-[30.25rem] text-center text-[32px] font-[400]">
              Declare your first variable
            </p>
            <p className="h-[1.5rem] w-[30.25rem] text-center text-[16px] font-[500]">
              Declare and store a variable against different environments
            </p>
          </div>

          <Button className="h-[2.25rem] w-[8rem] rounded-md bg-white text-black hover:bg-gray-300">
            Create variable
          </Button>
        </div>
      ) : (
        // Showing this when variables are present
        <div className={`flex h-full w-full flex-col items-center justify-start gap-y-8 p-3 text-white ${isDeleteDialogOpen ? "inert" : "" } `}>
          {allVariables.map((variable) => (
            <ContextMenu key={variable.variable.id}>
              <ContextMenuTrigger className="w-full">
                <Collapsible
                  className="w-full"
                  key={variable.variable.id}
                  onOpenChange={() => toggleSection(variable.variable.id)}
                  open={openSections.has(variable.variable.id)}
                >
                  <CollapsibleTrigger
                    className={`flex h-[6.75rem] w-full items-center justify-between gap-24 ${openSections.has(variable.variable.id) ? 'rounded-t-xl' : 'rounded-xl'} bg-[#232424] px-4 py-2 text-left`}
                  >
                    <div className="flex h-[2.375rem] items-center justify-center gap-4">
                      <span className="h-[2.375rem] text-2xl font-normal text-zinc-100">
                        {variable.variable.name}
                      </span>
                      <MessageSVG height="40" width="40" />
                    </div>
                    <div className="flex h-[6.5rem] w-[18.188rem] items-center justify-center gap-x-[3.125rem]">
                      <div className="flex h-[2.063rem] w-[13.563rem] items-center justify-center gap-x-3">
                        <div className="flex h-[2.063rem] w-[7.438rem] items-center justify-center text-base font-normal text-white text-opacity-50">
                          {dayjs(variable.variable.createdAt).toNow(true)} ago by
                        </div>
                        <div className="flex h-[2.063rem] w-[5.375rem] items-center justify-center gap-x-[0.375rem]">
                          <div className="flex h-[2.063rem] w-[3.5rem] items-center justify-center text-base font-medium text-white">
                            {variable.variable.lastUpdatedBy.name.split(' ')[0]}
                          </div>
                          <Avatar className="h-6 w-6">
                            <AvatarImage />
                            <AvatarFallback>
                              {variable.variable.lastUpdatedBy.name
                                .charAt(0)
                                .toUpperCase() +
                                variable.variable.lastUpdatedBy.name
                                  .slice(1, 2)
                                  .toLowerCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-[1.5rem] w-[1.5rem] text-zinc-400 transition-transform ${openSections.has(variable.variable.id) ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="h-full w-full gap-y-24 rounded-b-lg bg-[#232424] p-4">
                    {variable.values ? (
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
                          {variable.values.map((env) => (
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
                    ) : (
                      <></>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </ContextMenuTrigger>
              <ContextMenuContent className="flex h-[6.375rem] w-[15.938rem] flex-col items-center justify-center rounded-lg bg-[#3F3F46]">
                <ContextMenuItem
                  className="h-[33%] w-[15.938rem] border-b-[0.025rem] border-white/65 text-xs font-semibold tracking-wide"
                  onSelect={() => console.log('Show version history')}
                >
                  Show Version History
                </ContextMenuItem>
                <ContextMenuItem
                  className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide"
                  onSelect={() => console.log('Edit variable')}
                >
                  Edit
                </ContextMenuItem>
                <ContextMenuItem
                  className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide"
                  onSelect={() => openDeleteDialog(variable.variable.slug)}
                >
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
          
          {/* Delete variable alert dialog */}
          {isDeleteDialogOpen ? <ConfirmDelete
              isOpen={isDeleteDialogOpen}
              onClose={closeDeleteDialog}
              variableSlug={selectedVariableSlug}
            /> : null}
        </div>
      )}
    </div>
  )
}

export default VariablePage