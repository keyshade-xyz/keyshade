'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { PersonalAccessTokenCard } from './personal-access-token-card'
import { CreateTokenDialog } from './create-token-dialog'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { toast } from 'sonner'

interface PersonalAccessToken {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  expiresOn: string | null
  lastUsedOn: string | null
}

export default function PersonalAccessTokens(): JSX.Element {
  const [tokens, setTokens] = useState<PersonalAccessToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false)
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [regeneratedToken, setRegeneratedToken] = useState<string | null>(null)

  const getAllTokens = useHttp(() =>
    ControllerInstance.getInstance().personalAccessTokenController.getAllPersonalAccessTokens()
  )

  const fetchTokens = useCallback(async () => {
    setIsLoading(true)
    const { data, success } = await getAllTokens()
    if (success && data) {
      setTokens(data)
    }
    setIsLoading(false)
  }, [getAllTokens])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  const handleCreateToken = async (
    name: string,
    expiresAfterDays: number | null
  ): Promise<string | null> => {
    const { data, success, error } =
      await ControllerInstance.getInstance().personalAccessTokenController.createPersonalAccessToken(
        { name, expiresAfterDays }
      )

    if (success && data) {
      toast.success('Personal access token created successfully')
      await fetchTokens()
      return data.token
    } else if (error) {
      toast.error('Failed to create token')
      throw new Error(error.message)
    }
    return null
  }

  const handleDeleteToken = async () => {
    if (!selectedTokenId) return

    const { success, error } =
      await ControllerInstance.getInstance().personalAccessTokenController.deletePersonalAccessToken(
        { tokenId: selectedTokenId }
      )

    if (success) {
      toast.success('Personal access token deleted')
      await fetchTokens()
    } else if (error) {
      toast.error('Failed to delete token')
    }

    setDeleteDialogOpen(false)
    setSelectedTokenId(null)
  }

  const handleRegenerateToken = async () => {
    if (!selectedTokenId) return

    const { data, success, error } =
      await ControllerInstance.getInstance().personalAccessTokenController.regeneratePersonalAccessToken(
        { tokenId: selectedTokenId }
      )

    if (success && data) {
      setRegeneratedToken(data.token)
      toast.success('Personal access token regenerated')
      await fetchTokens()
    } else if (error) {
      toast.error('Failed to regenerate token')
      setRegenerateDialogOpen(false)
    }

    setSelectedTokenId(null)
  }

  const openDeleteDialog = (id: string) => {
    setSelectedTokenId(id)
    setDeleteDialogOpen(true)
  }

  const openRegenerateDialog = (id: string) => {
    setSelectedTokenId(id)
    setRegeneratedToken(null)
    setRegenerateDialogOpen(true)
  }

  const closeRegenerateDialog = () => {
    setRegenerateDialogOpen(false)
    setRegeneratedToken(null)
    setSelectedTokenId(null)
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-semibold">Personal Access Tokens</p>
          <p className="mt-1 text-sm text-white/60">
            Tokens for authenticating with the CLI and API
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          variant="primary"
        >
          <Plus className="h-4 w-4" />
          Create Token
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-white/60">
            Loading tokens...
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 py-8 text-center">
            <p className="text-white/60">No personal access tokens yet</p>
            <p className="mt-1 text-sm text-white/40">
              Create a token to authenticate with the CLI and API
            </p>
          </div>
        ) : (
          tokens.map((token) => (
            <PersonalAccessTokenCard
              key={token.id}
              createdAt={token.createdAt}
              expiresOn={token.expiresOn}
              id={token.id}
              lastUsedOn={token.lastUsedOn}
              name={token.name}
              onDelete={openDeleteDialog}
              onRegenerate={openRegenerateDialog}
            />
          ))
        )}
      </div>

      <CreateTokenDialog
        onCreateToken={handleCreateToken}
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Personal Access Token</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this token? Any applications using
              this token will no longer be able to authenticate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md bg-[#F4F4F5] text-black hover:bg-[#F4F4F5]/80 hover:text-black">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-md bg-[#DC2626] text-white hover:bg-[#DC2626]/80"
              onClick={handleDeleteToken}
            >
              Delete Token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog onOpenChange={closeRegenerateDialog} open={regenerateDialogOpen}>
        <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {regeneratedToken ? 'Token Regenerated' : 'Regenerate Personal Access Token'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {regeneratedToken
                ? "Make sure to copy your new token now. You won't be able to see it again!"
                : 'Are you sure you want to regenerate this token? The old token will stop working immediately.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {regeneratedToken ? (
            <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
              <code className="flex-1 break-all text-sm text-green-400">
                {regeneratedToken}
              </code>
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(regeneratedToken)
                  toast.success('Token copied to clipboard')
                }}
                size="sm"
                variant="ghost"
              >
                Copy
              </Button>
            </div>
          ) : null}
          <AlertDialogFooter>
            {regeneratedToken ? (
              <AlertDialogAction
                className="rounded-md bg-white text-black hover:bg-white/80"
                onClick={closeRegenerateDialog}
              >
                Done
              </AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel className="rounded-md bg-[#F4F4F5] text-black hover:bg-[#F4F4F5]/80 hover:text-black">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-md bg-yellow-600 text-white hover:bg-yellow-600/80"
                  onClick={handleRegenerateToken}
                >
                  Regenerate
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}