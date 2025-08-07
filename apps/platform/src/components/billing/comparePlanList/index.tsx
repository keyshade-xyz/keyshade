import React from 'react'
import { MinusSquareSVG, TickSVG } from '@public/svg/billing'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { PRICING_PLANS } from '@/constants/billing/comparePlan'

function renderPlanContent(plan: string, feature: string) {
  if (PRICING_PLANS[plan][feature] === false) {
    return <MinusSquareSVG className="mx-auto" />
  }
  if (PRICING_PLANS[plan][feature] === true) {
    return <TickSVG className="mx-auto" width={20} />
  }
  return PRICING_PLANS[plan][feature] || <MinusSquareSVG className="mx-auto" />
}

export default function ComparePlanList() {
  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold">Compare our plans</h2>
        <p className="text-sm font-medium text-white/60">
          Use the table below to compare the features of each plan.
        </p>
      </div>
      <Table className="mt-12 border border-white/20">
        <TableHeader className="bg-white/20">
          <TableRow>
            <TableHead className="text-center text-white">Features</TableHead>
            {Object.keys(PRICING_PLANS).map((plan) => (
              <TableHead
                className="border border-white/20 text-center text-white"
                key={plan}
              >
                {plan}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.keys(PRICING_PLANS.Free).map((feature) => (
            <TableRow key={feature}>
              <TableCell className="border border-white/20 text-center">
                {feature}
              </TableCell>
              {Object.keys(PRICING_PLANS).map((plan) => (
                <TableCell
                  className="border border-white/20 text-center text-white/60"
                  key={plan}
                >
                  {renderPlanContent(plan, feature)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
