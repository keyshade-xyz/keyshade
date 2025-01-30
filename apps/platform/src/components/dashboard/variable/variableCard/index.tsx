import type { GetAllVariablesOfProjectResponse } from '@keyshade/schema'
import { useSetAtom } from 'jotai'
import dayjs from 'dayjs'
import { NoteIconSVG } from '@public/svg/secret'
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
  ContextMenuItem} from '@/components/ui/context-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  deleteVariableOpenAtom,
  editVariableOpenAtom,
  selectedVariableAtom
} from '@/store'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'

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

  return (
    <ContextMenu key={variable.id}>
      <AccordionItem
        className="rounded-xl bg-white/5 px-5"
        key={variable.id}
        value={variable.id}
      >
        <AccordionTrigger
          className="hover:no-underline"
          rightChildren={
            <div className="text-xs text-white/50">
              {dayjs(variable.updatedAt).toNow(true)} ago by{' '}
              <span className="text-white">{variable.lastUpdatedBy.name}</span>
            </div>
          }
        >
          <div className="flex gap-x-5">
            <div className="flex items-center gap-x-4">
              {variable.name}
            </div>
            {variable.note ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <NoteIconSVG className="w-7" />
                  </TooltipTrigger>
                  <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                    <p>{variable.note}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Table className="h-full w-full">
            <TableHeader className="h-[3.125rem] w-full ">
              <TableRow className="h-full w-full bg-white/10 ">
                <TableHead className="h-full w-[10.25rem] rounded-tl-xl text-base font-bold text-white/50">
                  Environment
                </TableHead>
                <TableHead className="h-full rounded-tr-xl text-base font-normal text-white/50">
                  Value
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {values.map((value) => {
                return (
                  <TableRow
                    className="h-[3.125rem] w-full hover:bg-white/5"
                    key={value.environment.id}
                  >
                    <TableCell className="h-full w-[10.25rem] text-base">
                      {value.environment.name}
                    </TableCell>
                    <TableCell className="h-full text-base">
                      {value.value}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </AccordionContent>
      </AccordionItem>
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
