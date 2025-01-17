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

export default function SecretCard({ secret, values }: Secret) {
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
            <span className="text-white">{secret.lastUpdatedById}</span>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Environment</TableHead>
              <TableHead>Secret</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {values.map((value) => {
              return (
                <TableRow key={value.environment.id}>
                  <TableCell>{value.environment.slug}</TableCell>
                  <TableCell className="max-w-40 overflow-auto">
                    {value.value}
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
