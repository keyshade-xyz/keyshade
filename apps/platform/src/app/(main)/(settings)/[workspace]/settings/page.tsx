"use client"

import React, { useState } from 'react'
import dynamic from 'next/dynamic';
import type { EmojiClickData} from 'emoji-picker-react';
import { useAtom } from 'jotai';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { deleteWorkspaceOpenAtom, selectedWorkspaceAtom } from '@/store';
import ConfirmDeleteWorkspace from '@/components/dashboard/workspace/confirmDeleteWorkspace';

const EmojiPicker = dynamic(
  () => {
    return import('emoji-picker-react');
  },
  { ssr: false }
);

interface WorkspaceSettingsPageProps {
  params: { workspace: string }
}

const billingMethods = [
  { id: 'credit', cardType: 'Visa', cardNumber: '9876 4567 3210 1234' },
  { id: 'paypal', cardType: 'AMEX', cardNumber: '1234 3210 9876' },
  { id: 'bank', cardType: 'MasterCard', cardNumber: '3210 9876 4567 1234 4567' }
];

export default function WorkspaceSettingsPage({
  params
}: WorkspaceSettingsPageProps): JSX.Element {
  const workspaceSettings = params.workspace;
  const [selectedWorkspace] = useAtom(selectedWorkspaceAtom)
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useAtom(deleteWorkspaceOpenAtom)
  const [showPicker, setShowPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>(selectedWorkspace?.icon || '😊');
  const [updatedWorkspaceName, setUpdatedWorkspaceName] = useState<string>(selectedWorkspace?.name || 'Keyshade');
  const [billingMethod, setBillingMethod] = useState<{ id: string; cardType: string; cardNumber: string }>(billingMethods[0]);

  function handleEmojiSelect(emojiData: EmojiClickData) {
    setSelectedEmoji(emojiData.emoji);
    setShowPicker(false);
  }

  const handleBillingMethodChange = (id: string) => {
    const method = billingMethods.find((billMethod) => billMethod.id === id);
    if (!method) return;
    setBillingMethod({
      id: method.id,
      cardType: method.cardType,
      cardNumber: method.cardNumber
    });
  };

  const hasChanges = () => {
    return selectedEmoji !== selectedWorkspace?.icon || selectedWorkspace.name !== updatedWorkspaceName || billingMethod.id !== billingMethods[0].id;
  };

  const handleSaveDetails = () => {
    // Logic to save the details goes here
  };

  return (
    <main>
      {/* header section */}
      <section className="py-4 flex flex-col gap-2.5">
        <h1 className="font-bold text-2xl">{selectedWorkspace?.name ? `${selectedWorkspace.name} - ${workspaceSettings}` : 'Workspace'}</h1>
        <p className="text-white/60 font-medium text-lg">Update & manage your workspace.</p>
      </section>

      {/* content section */}
      <section className="mt-8 pb-10 flex flex-col items-start gap-10 border-b border-b-white/20">
        {/* emoji picker */}
        <div className="flex items-center gap-9">
          <div className="w-14 h-14 rounded-md bg-[#0B0D0F] flex items-center justify-center">
            <span
              aria-label='emoji'
              className="text-4xl"
              onClick={() => setShowPicker(!showPicker)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setShowPicker(!showPicker);
                }
              }}
              role='button'
              tabIndex={0}
              >
              {selectedEmoji}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-xl">Workspace Icon</h3>
            <p className="text-white/60 font-medium text-sm">Upload a picture to change your workspace icon across Keyshade.</p>
          </div>
        </div>

        {
          showPicker ?
          <EmojiPicker
          onEmojiClick={handleEmojiSelect}
          /> : null
        }

        {/* name & billing */}
        <div className="flex gap-20">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xl" htmlFor="name">Name</Label>
              <p className="text-white/60 text-sm">You can add the name of the workspace here.</p>
            </div>
            <Input
            id="name"
            onChange={(e) => setUpdatedWorkspaceName(e.target.value)}
            placeholder="Workspace name"
            value={selectedWorkspace?.name}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xl" htmlFor="billing-method">Billing Method</Label>
              <p className="text-white/60 text-sm">Billing email is used for making payments.</p>
            </div>
            <Select
              onValueChange={handleBillingMethodChange}
              value={billingMethod.id}
            >
              <SelectTrigger className=" h-[2.25rem] w-[20rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800">
                <SelectGroup>
                  {billingMethods.map((method) => (
                    <SelectItem
                      className="group cursor-pointer rounded-sm"
                      key={method.id}
                      value={method.id}
                    >
                      Card ending in {method.cardNumber.slice(-4)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button disabled={!hasChanges()} onClick={handleSaveDetails}>
          Save Details
        </Button>
      </section>

      {/* delete workspace section */}
      <section className="mt-20">
        <div className="w-[782px] py-8 px-6 flex items-center gap-4 bg-[#21191A] rounded-3xl border-2 border-[#E92D1F]">
          <div className="flex flex-col gap-2">
            <h4 className="text-[#E92D1F] font-bold text-2xl">Delete Workspace</h4>
            <p className="text-white/60 font-medium text-lg">Your workspace will be permanently deleted and access will be lost to any of your teams and data. This action is irreversible.</p>
          </div>
          <Button
          className="bg-[#E92D1F] text-white hover:bg-[#E92D1F]/80"
          onClick={() => setIsDeleteWorkspaceOpen(true)}
          >
            Delete
          </Button>
        </div>
      </section>

      {/* Delete environment alert dialog */}
      {isDeleteWorkspaceOpen && selectedWorkspace ? (
        <ConfirmDeleteWorkspace />
      ) : null}
    </main>
  )
}
