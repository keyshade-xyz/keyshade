import type { Secret } from '@keyshade/schema'
import { NoteIconSVG } from '@public/svg/secret'
import dayjs from 'dayjs'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface SecretCardProps {
  secretData: Secret
  isDecrypted: boolean
}

export default function SecretCard({
  secretData,
  isDecrypted
}: SecretCardProps) {
  const { secret, values } = secretData

  return (
    <AccordionItem
      className="rounded-xl bg-white/5 px-5"
      key={secret.id}
      value={secret.id}
    >
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
      <AccordionContent>
        <Table className="h-full w-full">
          <TableHeader className="h-[3.125rem] w-full ">
            <TableRow className="h-full w-full bg-white/10 ">
              <TableHead className="h-full w-[10.25rem] rounded-tl-xl text-base font-bold text-white/50">
                Environment
              </TableHead>
              <TableHead className="h-full  text-base font-normal text-white/50">
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
  )
}
