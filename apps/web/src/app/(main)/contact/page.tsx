'use client'

import React, { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { z } from 'zod'
import { ColorBGSVG } from '@public/hero'
import EncryptButton from '@/components/ui/encrypt-btn'

const contactSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  message: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters' })
})

type ContactFormData = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: ''
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const result = contactSchema.safeParse(formData)

    if (!result.success) {
      const errorMessage =
        result.error.errors[0]?.message || 'Please check your form inputs'

      toast.custom(() => (
        <div className="text-brandBlue border-brandBlue/20 bg-errorRed w-[90vw] rounded-lg border p-2 shadow-2xl backdrop-blur-3xl md:w-[20vw]">
          <p className="text-sm">{errorMessage}</p>
        </div>
      ))
      return
    }

    // Here you would typically send the form data to your backend

    toast.custom((_t) => (
      <div className="text-brandBlue border-brandBlue/20 w-[90vw] rounded-lg border bg-[#293234] p-3 shadow-2xl backdrop-blur-3xl md:w-[25vw]">
        <h1 className="font-semibold">Message Sent 🎉</h1>
        <p className="text-sm leading-relaxed">
          Thank you for reaching out! We&apos;ll get back to you as soon as
          possible.
        </p>
      </div>
    ))

    // Reset form after successful submission
    setFormData({
      name: '',
      email: '',
      message: ''
    })
  }

  return (
    <>
      <Toaster />
      <div className="relative flex min-h-screen flex-col items-center justify-center py-16 md:py-24">
        <ColorBGSVG className="absolute -z-10 -translate-y-[12rem]" />

        <div className="w-full max-w-4xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h1
              className={` text-brandBlue text-4xl font-extralight md:text-6xl`}
              style={{ textShadow: '0px 4px 4px rgba(202, 236, 241, 0.25)' }}
            >
              Get in <span className="font-semibold">Touch</span>
            </h1>
            <p className="text-brandBlue/80 mt-4 text-sm md:text-xl">
              Have questions about Keyshade? We&apos;re here to help!
            </p>
          </div>

          <div className="border-brandBlue/10 rounded-xl border bg-[#0D1112]/80 p-6 shadow-lg backdrop-blur-md md:p-8">
            <form
              className="space-y-6"
              onSubmit={(e) => {
                onSubmit(e)
              }}
            >
              <div className="space-y-2">
                <label
                  className="text-brandBlue/80 block text-sm font-medium"
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  className="border-brandBlue/20 text-brandBlue placeholder:text-brandBlue/40 focus:border-brandBlue/50 focus:ring-brandBlue/50 w-full rounded-lg border bg-[#0D1112]/50 p-3 focus:outline-none focus:ring-1"
                  id="name"
                  name="name"
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  type="text"
                  value={formData.name}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-brandBlue/80 block text-sm font-medium"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className="border-brandBlue/20 text-brandBlue placeholder:text-brandBlue/40 focus:border-brandBlue/50 focus:ring-brandBlue/50 w-full rounded-lg border bg-[#0D1112]/50 p-3 focus:outline-none focus:ring-1"
                  id="email"
                  name="email"
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                  type="email"
                  value={formData.email}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-brandBlue/80 block text-sm font-medium"
                  htmlFor="message"
                >
                  Message
                </label>
                <textarea
                  className="border-brandBlue/20 text-brandBlue placeholder:text-brandBlue/40 focus:border-brandBlue/50 focus:ring-brandBlue/50 w-full rounded-lg border bg-[#0D1112]/50 p-3 focus:outline-none focus:ring-1"
                  id="message"
                  name="message"
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  required
                  rows={6}
                  value={formData.message}
                />
              </div>

              <div className="flex justify-center pt-4">
                <div className="border-brandBlue/[8%] rounded-full border p-[0.31rem]">
                  <EncryptButton TARGET_TEXT="Send Message" />
                </div>
              </div>
            </form>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <ContactInfoCard
              content="support@keyshade.io"
              description="For general inquiries"
              title="Email"
            />
            <ContactInfoCard
              content="help@keyshade.io"
              description="Technical assistance"
              title="Support"
            />
            <ContactInfoCard
              content="partners@keyshade.io"
              description="Partnership opportunities"
              title="Business"
            />
          </div>
        </div>
      </div>
    </>
  )
}

function ContactInfoCard({
  title,
  content,
  description
}: {
  title: string
  content: string
  description: string
}) {
  return (
    <div className="border-brandBlue/10 rounded-lg border bg-[#0D1112]/60 p-4 text-center backdrop-blur-sm">
      <h3 className="text-brandBlue mb-2 text-lg font-medium">{title}</h3>
      <p className="text-brandBlue font-medium">{content}</p>
      <p className="text-brandBlue/60 mt-1 text-sm">{description}</p>
    </div>
  )
}
