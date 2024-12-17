'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { VariableController } from '@keyshade/api-client'
import {
  ClientResponse,
  GetAllVariablesOfProjectResponse,
  Project,
} from '@keyshade/schema'
import { FolderSVG } from '@public/svg/dashboard'
import { MessageSVG } from '@public/svg/shared'
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

interface VariablePageProps {
  currentProject: Project | undefined
  // availableEnvironments: Environment[]
}


function VariablePage({
  currentProject
  // availableEnvironments
}: VariablePageProps): React.JSX.Element {

  const [allVariables, setAllVariables] = useState<GetAllVariablesOfProjectResponse['items']>([])
  // Holds the currently open section ID
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

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

  useEffect(() => {
    const variableController = new VariableController(
      process.env.NEXT_PUBLIC_BACKEND_URL
    )

    const getVariables = async () => {
      const {
        success,
        error,
        data
      }: ClientResponse<GetAllVariablesOfProjectResponse> =
        await variableController.getAllVariablesOfProject(
          { projectSlug: currentProject?.slug },
          {}
        )

      if (success && data) {
        setAllVariables(data.items)
      } else {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      }
    }

    getVariables()
  }, [currentProject])

  return (
    <div className="flex h-full w-full justify-center  ">
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
        <div className="flex h-full w-full flex-col items-center justify-start gap-y-8 text-white p-3">
          {allVariables.map((variable) => (
            <Collapsible
              key={variable.variable.id}
              open={openSections.has(variable.variable.id)}
              onOpenChange={() => toggleSection(variable.variable.id)}
              className="w-full"
            >
              <CollapsibleTrigger className={`h-[6.75rem] w-full gap-24 flex items-center justify-between ${openSections.has(variable.variable.id) ? 'rounded-t-xl' : 'rounded-xl'} bg-[#232424] px-4 py-2 text-left`}>
                <div className="h-[2.375rem] flex justify-center items-center gap-4">
                  <span className="h-[2.375rem] text-2xl font-normal text-zinc-100">
                    {variable.variable.name} 
                  </span>
                  <MessageSVG height="40" width="40" />
                </div>
                <div className="h-[6.5rem] w-[18.188rem] flex justify-center items-center gap-x-[3.125rem]">
                  <div className="h-[2.063rem] w-[13.563rem] flex justify-center items-center gap-x-3">
                    <div className="flex justify-center items-center h-[2.063rem] w-[7.438rem] text-base font-normal text-white text-opacity-50">
                      {(() => {
                        const days = Math.ceil(Math.abs(new Date().getTime() - new Date(variable.variable.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                        return `${days} ${days === 1 ? 'day' : 'days'} ago by`;
                      })()}
                    </div>
                    <div className="flex justify-center items-center h-[2.063rem] w-[5.375rem] gap-x-[0.375rem]">
                      <div className="flex justify-center items-center h-[2.063rem] w-[3.5rem] text-base text-white font-medium">
                        {variable.variable.lastUpdatedBy.name.split(' ')[0]}
                      </div>
                      <Avatar className="h-6 w-6">
                        <AvatarImage />
                        <AvatarFallback>
                          {variable.variable.lastUpdatedBy.name.charAt(0).toUpperCase() + variable.variable.lastUpdatedBy.name.slice(1, 2).toLowerCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <ChevronDown className={`h-[1.5rem] w-[1.5rem] text-zinc-400 transition-transform ${openSections.has(variable.variable.id) ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="gap-y-24 h-full w-full rounded-b-lg bg-[#232424] p-4">
                {variable.values ? (
                  <Table className="h-full w-full">
                    <TableHeader className="h-[3.125rem] w-full">
                      <TableRow className="h-[3.125rem] w-full hover:bg-[#232424]">
                        <TableHead className="h-full w-[10.25rem] border-2 border-white/30 text-white text-base font-bold">Environment</TableHead>
                        <TableHead className="h-full border-2 border-white/30 text-white text-base font-normal">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variable.values.map((env) => (
                        <TableRow key={env.environment.id} className="h-[3.125rem] w-full hover:bg-[#232424] hover:cursor-pointer">
                          <TableCell className="h-full w-[10.25rem] border-2 border-white/30 text-white text-base font-bold">
                            {env.environment.name}
                          </TableCell>
                          <TableCell className="h-full border-2 border-white/30 text-white text-base font-normal">
                            {env.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-zinc-400">
                    No content available for this section.
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  )
}

export default VariablePage
