'use client'
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

function ProfilePage(): React.JSX.Element {
  const [email, setEmail] = useState<string>('sawan@keyshade.xyz')
  const [username, setUsername] = useState<string>('kriptonian')

  return (
    <main className="flex h-[78vh] flex-col gap-y-10 overflow-y-auto">
      {/* Avatar */}
      <div className="flex gap-[5vw]">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Avatar</div>
          <span className="text-sm text-white/70">
            Upload a picture to change your avatar across Keyshade.
          </span>
        </div>
        <div className="aspect-square w-[5rem] rounded-full bg-gray-600" />{' '}
        {/* //! This is will be replaced by an image tag */}
      </div>
      {/* Name */}
      <div className="flex max-w-[20vw] flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Name</div>
          <span className="text-sm text-white/70">
            Your name is how you&apos;re identified across Keyshade.
          </span>
        </div>
        <Input
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setUsername(e.target.value)
          }}
          placeholder="Username"
          value={username}
        />
      </div>
      {/* Email */}
      <div className="flex max-w-[20vw] flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Email</div>
          <span className="text-sm text-white/70">
            Your email is used to log in and receive notifications.
          </span>
        </div>
        <Input
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(e.target.value)
          }}
          placeholder="email"
          value={email}
        />
      </div>
      <div>
        <Button disabled variant="secondary">
          Save Changes
        </Button>
      </div>
      <Separator className="max-w-[30vw] bg-white/15" />
      {/* <div className="flex max-w-[20vw] flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Rest Password</div>
          <span className="text-sm text-white/70">
            Change your password to keep your account secure. Make sure you use
            a strong password.
          </span>
        </div>
        <span>
          <Label>Curent Password</Label>
          <Input placeholder="current password" type="password" />
        </span>
        <span>
          <Label>New Password</Label>
          <Input placeholder="new password" type="password" />
        </span>
        <span>
          <Label>Confirm Password</Label>
          <Input placeholder="confirm password" type="password" />
        </span>
      </div>
      <div>
        <Button disabled variant="secondary">
          Change Password
        </Button>
      </div> */}

      <div className="flex max-w-[20vw] flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">API Keys</div>
          <span className="text-sm text-white/70">
            Generate new API keys to use with the Keyshade CLI.
          </span>
        </div>
      </div>

      <Separator className="max-w-[30vw] bg-white/15" />

      <div className=" flex max-w-[30vw] justify-between rounded-3xl border border-red-500  bg-red-500/5 px-10 py-8">
        <div>
          <h2 className={` text-xl font-bold text-red-500`}>Delete account</h2>
          <p className="max-w-[20rem] text-sm text-white/70">
            Your account will be permanently deleted and access will be lost to
            any of your teams and data. This action is irreversible.
          </p>
        </div>

        <div className="flex items-center">
          <Button aria-label="Delete account" variant="destructive">
            Delete
          </Button>
        </div>
      </div>
    </main>
  )
}

export default ProfilePage
