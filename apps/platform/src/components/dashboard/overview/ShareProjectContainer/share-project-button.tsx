'use client'

import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'

export default function ShareProjectButton({ projectSlug }: { projectSlug: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpen = useCallback(() => setIsOpen(true), [])
  
  const handleClose = useCallback(() => {
    setIsOpen(false)
    // Reset form state on close
    setSelectedMember('')
    setPrivateKey('')
  }, [])

  const handleShare = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const url = `/api/project/${projectSlug}/share`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        projectSlug, 
        recipientEmail: selectedMember,
        privateKey 
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { message?: string };
      throw new Error(errorData.message || 'Failed to share');
    }

    toast.success('Project shared successfully!');
    handleClose();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    toast.error(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div>
      <Button onClick={handleOpen} type="button" variant="primary">
        Share
      </Button>

      <Dialog onOpenChange={handleClose} open={isOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleShare}>
            <DialogHeader>
              <DialogTitle>Whom would you like to share this project with?</DialogTitle>
              <DialogDescription>
                Select a team member and enter your private key to securely generate their access link.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-5 py-6">
              {/* Member Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80" htmlFor="member">
                  Team Member
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white ring-offset-zinc-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  id="member"
                  onChange={(e) => setSelectedMember(e.target.value)}
                  required
                  value={selectedMember}
                >
                  <option disabled value="">Select an account...</option>
                  <option value="bob@keyshade.com">Bob (bob@keyshade.com)</option>
                  <option value="alice@keyshade.com">Alice (alice@keyshade.com)</option>
                </select>
              </div>

              {/* Private Key Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80" htmlFor="privateKey">
                  Private Key
                </label>
                <input
                  className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-white/40 ring-offset-zinc-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  id="privateKey"
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Enter private key"
                  required
                  type="password"
                  value={privateKey}
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={isSubmitting} type="submit" variant="primary">
                {isSubmitting ? 'Generating...' : 'Share Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}