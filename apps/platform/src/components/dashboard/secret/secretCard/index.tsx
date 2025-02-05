import type { Secret } from '@keyshade/schema'
import { NoteIconSVG } from '@public/svg/secret'
import dayjs from 'dayjs'
import { useSetAtom } from 'jotai'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
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
  deleteSecretOpenAtom,
  editSecretOpenAtom,
  selectedSecretAtom
} from '@/store'

interface SecretCardProps {
  secretData: Secret
  isDecrypted: boolean
}

export default function SecretCard({
  secretData,
  isDecrypted
}: SecretCardProps) {
  const { secret, values } = secretData

  const setSelectedSecret = useSetAtom(selectedSecretAtom)
  const setIsEditSecretOpen = useSetAtom(editSecretOpenAtom)
  const setIsDeleteSecretOpen = useSetAtom(deleteSecretOpenAtom)

  const handleEditClick = () => {
    setSelectedSecret(secretData)
    setIsEditSecretOpen(true)
  }

  const handleDeleteClick = () => {
    setSelectedSecret(secretData)
    setIsDeleteSecretOpen(true)
  }

  return (
    <ContextMenu>
      <AccordionItem
        className="rounded-xl bg-white/5 px-5"
        key={secret.id}
        value={secret.id}
      >
        <ContextMenuTrigger>
          <AccordionTrigger
            className="hover:no-underline"
            rightChildren={
              <div className="text-xs text-white/50">
                {dayjs(secret.updatedAt).toNow(true)} ago by{' '}
                <span className="text-white">{secret.lastUpdatedBy.name}</span>
              </div>
            }
          >
            <div className="flex gap-x-5">
              <div className="flex items-center gap-x-4">
                {/* <SecretLogoSVG /> */}
                {secret.name}
              </div>
              {secret.note ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <NoteIconSVG className="w-7" />
                    </TooltipTrigger>
                    <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                      <p>{secret.note}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
          </AccordionTrigger>
        </ContextMenuTrigger>
        <AccordionContent>
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
              {values.map((value) => {
                return (
                  <TableRow
                    className="h-[3.125rem] w-full hover:cursor-pointer hover:bg-[#232424]"
                    key={value.environment.id}
                  >
                    <TableCell className="h-full w-[10.25rem] border-2 border-white/30 text-base font-bold text-white">
                      {value.environment.name}
                    </TableCell>
                    <TableCell className="h-full border-2 border-white/30 text-base font-normal text-white">
                      {isDecrypted
                        ? value.value
                        : value.value.replace(/./g, '*').substring(0, 20)}
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
