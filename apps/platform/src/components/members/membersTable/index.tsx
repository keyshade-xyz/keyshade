'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import dayjs from 'dayjs'
import { EditTwoSVG, MedalStarSVG, UserRemoveSVG } from '@public/svg/shared'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import AvatarComponent from '@/components/common/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export default function MembersTable({
  members,
}): React.JSX.Element {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)

  // Filter members where invitationAccepted is true
  const acceptedMembers = members.filter(member => member.invitationAccepted === true)

  // Calculate pagination values using filtered members
  const totalMembers = acceptedMembers.length
  const totalPages = Math.ceil(totalMembers / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentMembers = acceptedMembers.slice(startIndex, endIndex)

  return (
    <div className="h-full w-full">
      <div className="w-full rounded-3xl bg-[#1D1D20] ">
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className='text-sm font-medium text-white text-left'>Name</TableHead>
              <TableHead className='text-sm font-medium text-white text-left'>Joining Date</TableHead>
              <TableHead className='text-sm font-medium text-white text-left'>Roles</TableHead>
              <TableHead className='w-[10%]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentMembers.length > 0 ? (
              currentMembers.map((member) => (
                <TableRow className='hover:bg-transparent group' key={member.id}>
                  <TableCell className='text-left w-[30%]'>
                    <div className="flex items-center">
                      <AvatarComponent
                        className='h-10 w-10'
                        name={member.user.name || ''}
                        profilePictureUrl={member.user.profilePictureUrl}
                      />
                      <div className="ml-3">
                        <div className="text-base font-medium text-white">{member.user.name}</div>
                        <div className="text-xs font-normal text-white">{member.user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-left w-[30%]'>
                    {dayjs(member.createdOn as string).format('MMM D, YYYY')}
                  </TableCell>
                  <TableCell className="text-left w-[40%]">
                    <div className='w-[8rem] py-3 flex justify-center items-center rounded-md bg-[#083344] border border-[#A5F3FC] text-[#A5F3FC]'>{member.roles[0].role.name}</div>
                  </TableCell>
                  <TableCell className=" opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-left">
                    <div className="flex gap-2 justify-start">
                      <Button className="p-1 bg-transparent hover:bg-transparent border-none"><UserRemoveSVG /></Button>
                      <Button className="p-1 bg-transparent hover:bg-transparent border-none"><EditTwoSVG /></Button>
                      <Button className="p-1 bg-transparent hover:bg-transparent border-none"><MedalStarSVG /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : null}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between mt-4 py-7 px-[5.5rem]">
          <div className="text-sm text-[#A1A1AA] font-normal">
            0 out of {totalMembers} row(s) selected
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#FAFAFA] font-medium">Rows per page</span>
              <Select
                onValueChange={(value) => setRowsPerPage(Number(value))}
                value={rowsPerPage.toString()}
              >
                <SelectTrigger className="w-[4.375rem] border border-[#27272A] rounded-md ">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent className="w-[4.375rem] border border-[#27272A] rounded-md">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-[#FAFAFA] font-medium mx-2">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-3">
              <Button
                className="h-8 w-8 p-0 bg-[#71717A] text-white border border-[#27272A] hover:bg-[#81818A]"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                variant="outline"
              >
                <ChevronsLeft className='h-4 w-4' />
              </Button>
              <Button
                className="h-8 w-8 p-0 bg-[#71717A] text-white border border-[#27272A] hover:bg-[#81818A]"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                variant="outline"
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                className="h-8 w-8 p-0 bg-[#71717A] text-white border border-[#27272A] hover:bg-[#81818A]"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                variant="outline"
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
              <Button
                className="h-8 w-8 p-0 bg-[#71717A] text-white border border-[#27272A] hover:bg-[#81818A]"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                variant="outline"
              >
                <ChevronsRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
