import type { Secret } from '@keyshade/schema'
import dayjs, { extend } from 'dayjs'
import { useSetAtom } from 'jotai'
import { NoteIconSVG } from '@public/svg/secret'
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
  selectedSecretAtom,
  rollbackSecretOpenAtom
} from '@/store'
import AvatarComponent from '@/components/common/avatar'
import { copyToClipboard } from '@/lib/clipboard'

extend(dayjs)

interface SecretCardProps {
  secretData: Secret | undefined
  isDecrypted: boolean
}
export default function SecretCard({
  secretData,
  isDecrypted
}: SecretCardProps) {
  const setSelectedSecret = useSetAtom(selectedSecretAtom)
  const setIsEditSecretOpen = useSetAtom(editSecretOpenAtom)
  const setIsDeleteSecretOpen = useSetAtom(deleteSecretOpenAtom)
  const setIsRollbackSecretOpen = useSetAtom(rollbackSecretOpenAtom)
  
  if (!secretData?.secret) {
    return null;
  }
  
  const { secret, values } = secretData

  const handleCopyToClipboard = () => {
    copyToClipboard(secret.slug, 'You copied the slug successfully.', 'Failed to copy the slug.', 'You successfully copied the slug.')
  }

  const handleEditClick = () => {
    setSelectedSecret(secretData)
    setIsEditSecretOpen(true)
  }

  const handleDeleteClick = () => {
    setSelectedSecret(secretData)
    setIsDeleteSecretOpen(true)
  }

  const handleVersionHistoryClick = () => {
    setSelectedSecret(secretData)
    setIsRollbackSecretOpen(true)
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
              <div className="flex items-center gap-x-4 text-xs text-white/50">
                {dayjs(secret.updatedAt).toNow(true)} ago by{' '}
                <div className="flex items-center gap-x-2">
                  <span className="text-white">
                    {secret.lastUpdatedBy.name}
                  </span>
                  <AvatarComponent
                    name={secret.lastUpdatedBy.name}
                    src={secret.lastUpdatedBy.profilePictureUrl}
                  />
                </div>
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
              <TableRow className="h-[3.125rem] w-full bg-white/10">
                <TableHead className="h-full w-[10.25rem] rounded-tl-xl text-base font-normal text-white/50">
                  Environment
                </TableHead>
                <TableHead className="h-full text-base font-normal text-white/50">
                  Value
                </TableHead>
                <TableHead className="h-full rounded-tr-xl text-base font-normal text-white/50">
                  Version
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
                      {isDecrypted
                        ? value.value
                        : value.value.replace(/./g, '*').substring(0, 20)}
                    </TableCell>
                    <TableCell className="h-full px-8 py-4 text-base">
                      {value.version}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </AccordionContent>
      </AccordionItem>
      <ContextMenuContent className="flex w-[15.938rem] flex-col items-center justify-center rounded-lg bg-[#3F3F46]">
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] border-b-[0.025rem] border-white/65 text-xs font-semibold tracking-wide"
          onSelect={handleVersionHistoryClick}
        >
          Show Version History
        </ContextMenuItem>
        <ContextMenuItem
          className="w-[15.938rem] py-2 border-b-[0.025rem] border-white/65 text-xs font-semibold tracking-wide"
          onSelect={handleCopyToClipboard}
        >
          Copy slug
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
