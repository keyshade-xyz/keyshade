import type { GetAllVariablesOfProjectResponse } from '@keyshade/schema'
import { useSetAtom } from 'jotai'
import dayjs from 'dayjs'
import { NoteIconSVG } from '@public/svg/secret'
import { TrashWhiteSVG } from '@public/svg/shared'
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
import {
  deleteEnvironmentValueOfVariableOpenAtom,
  deleteVariableOpenAtom,
  editVariableOpenAtom,
  selectedVariableAtom,
  selectedVariableEnvironmentAtom,
  variableRevisionsOpenAtom
} from '@/store'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import AvatarComponent from '@/components/common/avatar'
import { copyToClipboard } from '@/lib/clipboard'

interface VariableCardProps {
  variableData: GetAllVariablesOfProjectResponse['items'][number]
  className?: string
}

export default function VariableCard({
  variableData,
  className
}: VariableCardProps) {
  const setSelectedVariable = useSetAtom(selectedVariableAtom)
  const setSelectedVariableEnvironment = useSetAtom(
    selectedVariableEnvironmentAtom
  )
  const setIsEditVariableOpen = useSetAtom(editVariableOpenAtom)
  const setIsDeleteVariableOpen = useSetAtom(deleteVariableOpenAtom)
  const setIsDeleteEnvironmentValueOfVariableOpen = useSetAtom(
    deleteEnvironmentValueOfVariableOpenAtom
  )
  const setIsVariableRevisionsOpen = useSetAtom(variableRevisionsOpenAtom)

  const canUpdateVariable = variableData.entitlements.canUpdate
  const canDeleteVariable = variableData.entitlements.canDelete

  const { versions } = variableData
  const handleCopyToClipboard = () => {
    copyToClipboard(
      variableData.slug,
      'You copied the slug successfully.',
      'Failed to copy the slug.',
      'You successfully copied the slug.'
    )
  }

  const handleEditClick = () => {
    setSelectedVariable(variableData)
    setIsEditVariableOpen(true)
  }

  const handleDeleteClick = () => {
    setSelectedVariable(variableData)
    setIsDeleteVariableOpen(true)
  }

  const handleDeleteEnvironmentValueOfVariableClick = (environment: string) => {
    setSelectedVariable(variableData)
    setSelectedVariableEnvironment(environment)
    setIsDeleteEnvironmentValueOfVariableOpen(true)
  }

  const handleRevisionsClick = () => {
    setSelectedVariable(variableData)
    setIsVariableRevisionsOpen(true)
  }

  return (
    <ContextMenu key={variableData.id}>
      <AccordionItem
        className={`rounded-xl bg-white/5 px-5 ${className}`}
        id={`variable-${variableData.slug}`}
        key={variableData.id}
        value={variableData.id}
      >
        <ContextMenuTrigger>
          <AccordionTrigger
            className="overflow-hidden hover:no-underline"
            rightChildren={
              <div className="flex items-center gap-x-4 text-xs text-white/50">
                {dayjs(variableData.updatedAt).toNow(true)} ago by{' '}
                <div className="flex items-center gap-x-2">
                  <span className="text-white">
                    {variableData.lastUpdatedBy.name}
                  </span>
                  <AvatarComponent
                    name={variableData.lastUpdatedBy.name}
                    profilePictureUrl={
                      variableData.lastUpdatedBy.profilePictureUrl
                    }
                  />
                </div>
              </div>
            }
          >
            <div className="mr-5 flex flex-1 gap-x-5 overflow-hidden">
              <div className="flex items-center gap-x-4 truncate">
                {variableData.name}
              </div>
              {variableData.note ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <NoteIconSVG className="w-7" />
                    </TooltipTrigger>
                    <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                      <p>{variableData.note}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
          </AccordionTrigger>
        </ContextMenuTrigger>
        <AccordionContent>
          {versions.length > 0 ? (
            <Table className="h-full w-full">
              <TableHeader className="h-[3.125rem] w-full ">
                <TableRow className="h-full w-full bg-white/10 ">
                  <TableHead className="h-full w-[10.25rem] rounded-tl-xl text-base font-normal text-white/50">
                    Environment
                  </TableHead>
                  <TableHead className="h-full text-base font-normal text-white/50">
                    Value
                  </TableHead>
                  <TableHead className="h-full rounded-tr-xl text-base font-normal text-white/50">
                    Version
                  </TableHead>
                  <TableHead className="h-full w-[100px] rounded-tr-xl text-base font-normal text-white/50" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((value) => {
                  return (
                    <TableRow
                      className="group h-[3.125rem] w-full hover:bg-white/5"
                      key={value.environment.id}
                    >
                      <TableCell className="h-full w-[10.25rem] text-base">
                        {value.environment.name}
                      </TableCell>
                      <TableCell className="h-full text-base">
                        {value.value}
                      </TableCell>
                      <TableCell className="h-full px-8 py-4 text-base">
                        {value.version}
                      </TableCell>
                      <TableCell className="h-full px-8 py-4 text-base opacity-0 transition-all duration-150 ease-in-out group-hover:opacity-100">
                        <button
                          onClick={() =>
                            handleDeleteEnvironmentValueOfVariableClick(
                              value.environment.slug
                            )
                          }
                          type="button"
                        >
                          <TrashWhiteSVG />
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-white/50">
              You have not added any values for any environment to this variable
              yet. Edit the variable to add values.
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
      <ContextMenuContent className="flex w-[15.938rem] flex-col items-center justify-center rounded-lg bg-[#3F3F46]">
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] border-b-[0.025rem] border-white/65 text-xs font-semibold tracking-wide"
          onSelect={handleRevisionsClick}
        >
          Show Version History
        </ContextMenuItem>
        <ContextMenuItem
          className="w-[15.938rem] border-b-[0.025rem] border-white/65 py-2 text-xs font-semibold tracking-wide"
          onSelect={handleCopyToClipboard}
        >
          Copy slug
        </ContextMenuItem>
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide"
          disabled={!canUpdateVariable}
          onSelect={handleEditClick}
        >
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide"
          disabled={!canDeleteVariable}
          onSelect={handleDeleteClick}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
