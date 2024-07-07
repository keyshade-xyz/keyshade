'use client'
import React, { useEffect, useState } from 'react'
// import { SecretLogoSVG } from '@public/svg/secret'
import { usePathname } from 'next/navigation'
import dayjs, { extend } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { NoteIconSVG } from '@public/svg/secret'
import {
  Accordion,
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
import { Secrets } from '@/lib/api-functions/secrets'
import type { Secret } from '@/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import Loading from '@/components/ui/loading' // Import Loading component

extend(relativeTime)

function SecretPage(): React.JSX.Element {
  const [allSecrets, setAllSecrets] = useState<Secret[]>()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true); // State to manage loading state

  useEffect(() => {
    Secrets.getAllSecretbyProjectId(pathname.split('/')[2])
      .then((data) => {
        setAllSecrets(data)
        setLoading(false); //  loading becomes false once data is fetched
      })
      .catch((error) => {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
        setLoading(false); // Handling loading state in case of error
      })
  }, [pathname])

  return (
    <ScrollArea className="mb-4 h-[50rem]">
      {loading ? (
        // Rendering Loading when data is loading
        <Loading />
      ) : (
        <Accordion
          className="flex h-[50rem] flex-col gap-4"
          collapsible
          type="single"
        >
          {allSecrets?.map((secret) => {
            return (
              <AccordionItem
                className="rounded-xl bg-white/5 px-5"
                key={secret.secret.id}
                value={secret.secret.id}
              >
                <AccordionTrigger
                  className="hover:no-underline"
                  rightChildren={
                    <div className="text-xs text-white/50">
                      {dayjs(secret.secret.updatedAt).toNow(true)} ago by{' '}
                      <span className="text-white">
                        {secret.secret.lastUpdatedBy.name}
                      </span>
                    </div>
                  }
                >
                  <div className="flex gap-x-5">
                    <div className="flex items-center gap-x-4">
                      {secret.secret.name}
                    </div>
                    {secret.secret.note ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <NoteIconSVG className="w-7" />
                          </TooltipTrigger>
                          <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                            <p>{secret.secret.note}</p>
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
                      {secret.values.map((value) => {
                        return (
                          <TableRow key={value.environment.id}>
                            <TableCell>{value.environment.name}</TableCell>
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
          })}
        </Accordion>
      )}
    </ScrollArea>
  )
}

export default SecretPage
