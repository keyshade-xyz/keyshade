import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { BILLING_FAQS } from '@/constants/billing/billingFAQ'

export default function BillingFAQ(): React.JSX.Element {
  return (
    <div>
      <div className="pt-4">
        <h1 className="text-2xl font-bold">FAQ&apos;s</h1>
        <p className="mt-2.5 text-sm font-medium text-white/60">
          Here are some frequently asked questions about billing. If you have
          any other questions, feel free to contact our support team.
        </p>
      </div>
      <Accordion className="mt-10 w-full" collapsible type="single">
        {BILLING_FAQS.map((faq) => (
            <AccordionItem
              className="rounded-xl bg-white/5 px-9 my-4"
              key={faq.id}
              value={faq.id}
            >
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <p>{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
