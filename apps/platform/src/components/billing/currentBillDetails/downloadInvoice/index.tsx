import React, { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import type {
  GetAllWorkspacesOfUserResponse,
  GetPaymentHistoryResponse,
  Status
} from '@keyshade/schema'
import { DownloadSVG, MoneySend } from '@public/svg/badges'
import TabelLoader from './tabel-loader'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import Visible from '@/components/common/visible'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { Badge } from '@/components/ui/badge'
import { formatText } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DownloadInvoiceProps {
  currentWorkspace: GetAllWorkspacesOfUserResponse['items'][number] | null
}

export default function DownloadInvoice({
  currentWorkspace
}: DownloadInvoiceProps) {
  const [invoices, setInvoices] = useState<GetPaymentHistoryResponse['items']>()
  const [isLoading, setIsLoading] = useState(true)

  const downloadAllInvoices = useHttp(() => {
    return ControllerInstance.getInstance().paymentController.downloadAllInvoices(
      {
        workspaceSlug: currentWorkspace?.slug ?? ''
      }
    )
  })

  const donaloadInvoiceById = useHttp((id: string) => {
    return ControllerInstance.getInstance().paymentController.downloadInvoiceById(
      {
        workspaceSlug: currentWorkspace?.slug ?? '',
        orderId: id
      }
    )
  })

  const invoiceHistory = useHttp(() => {
    return ControllerInstance.getInstance().paymentController.getPaymentHistory(
      {
        workspaceSlug: currentWorkspace?.slug ?? ''
      }
    )
  })

  const onDownloadAllInvoices = async () => {
    const response = await downloadAllInvoices()
    if (response.data?.length === 0) {
      toast.error('No invoices found to download.')
      return
    }
    response.data?.forEach((invoice) => {
      const link = document.createElement('a')
      link.href = invoice.url
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })

    toast.success('Invoices downloaded successfully.')
  }

  const onDownloadInvoicesById = async (id: string) => {
    const { error, success, data } = await donaloadInvoiceById(id)
    if (error) {
      toast.error(error.message)
    }
    if (success && data?.url) {
      const link = document.createElement('a')
      link.href = data.url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const loadInvoiceHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await invoiceHistory()
      if (response.data?.items.length === 0) {
        toast.error('No invoice history found.')
        setInvoices([])
        return
      }
      setInvoices(response.data?.items)
    } catch (error) {
      // eslint-disable-next-line no-console -- Log error to console
      console.error('Failed to load invoice history:', error)
      setInvoices([])
    } finally {
      setIsLoading(false)
    }
  }, [invoiceHistory])

  useEffect(() => {
    if (currentWorkspace?.slug) {
      loadInvoiceHistory()
    }
  }, [currentWorkspace?.slug, loadInvoiceHistory])

  const renderBadge = (status: Status) => {
    switch (status) {
      case 'paid':
        return (
          <Badge color="green" icon="done" type="icon" variant="solid">
            {formatText(status)}
          </Badge>
        )
      case 'pending':
        return (
          <Badge color="yellow" icon="waiting" type="icon" variant="solid">
            {formatText(status)}
          </Badge>
        )
      case 'partially_refunded':
        return (
          <Badge
            className="!border-[#F9773D3D] !bg-[#F9773D33] !text-[#F9773D]"
            color="yellow"
            icon={<MoneySend />}
            type="icon"
            variant="solid"
          >
            {formatText(status)}
          </Badge>
        )

      default:
        break
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-neutral-300">
            You can view and download your invoices from the billing history
            section.
          </p>
        </div>
        <Button onClick={onDownloadAllInvoices} variant="secondary">
          Download all
        </Button>
      </div>
      <div className="mt-12 overflow-hidden rounded-lg border border-[#27272A]">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableCell>Invoice ID</TableCell>
              <TableCell className="text-center"> Billing Date</TableCell>
              <TableCell className="text-center">Status</TableCell>
              <TableCell className="text-center">Amount</TableCell>
              <TableCell className="text-center">Plan</TableCell>
              <TableCell className="text-center">Download</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Visible if={isLoading}>
              <TabelLoader />
            </Visible>
            <Visible if={!isLoading && invoices?.length === 0}>
              <TableRow>
                <TableCell className="text-center" colSpan={5}>
                  No invoices found.
                </TableCell>
              </TableRow>
            </Visible>
            {!isLoading &&
              invoices !== undefined &&
              invoices.length > 0 &&
              invoices.map((invoice) => (
                <TableRow key={invoice.orderId}>
                  <TableCell>{invoice.orderId}</TableCell>
                  <TableCell className="text-center">
                    <div>{dayjs(invoice.date).format('MMMM DD, YYYY')}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    {renderBadge(invoice.status)}
                  </TableCell>
                  <TableCell className="text-center">
                    {invoice.amount}
                  </TableCell>
                  <TableCell className="text-center">{invoice.plan}</TableCell>
                  <TableCell className="flex h-full justify-center">
                    <button
                      onClick={() => {
                        void onDownloadInvoicesById(invoice.orderId)
                      }}
                      type="button"
                    >
                      <DownloadSVG />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
