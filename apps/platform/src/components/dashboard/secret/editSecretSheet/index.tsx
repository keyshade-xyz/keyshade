import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { editSecretOpenAtom, secretsOfProjectAtom, selectedSecretAtom } from '@/store'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { UpdateSecretRequest } from '@keyshade/schema'
import ControllerInstance from '@/lib/controller-instance'

export default function EditSecretSheet(): JSX.Element {
	const [isEditSecretSheetOpen, setIsEditSecretSheetOpen] = useAtom(editSecretOpenAtom)
	const selectedSecretData = useAtomValue(selectedSecretAtom)
	const setSecrets = useSetAtom(secretsOfProjectAtom)

	const [requestData, setRequestData] = useState<{
		name: string | undefined
		note: string | undefined
	}>({
		name: selectedSecretData?.secret.name,
		note: selectedSecretData?.secret.note || ''
	})

	const handleClose = useCallback(() => {
		setIsEditSecretSheetOpen(false)
	}, [setIsEditSecretSheetOpen])

	const updateSecret = useCallback(async () => {
	  if (!selectedSecretData) {
			toast.error('No secret selected', {
				description: (
					<p className="text-xs text-red-300">
						No secret selected. Please select a secret.
					</p>
				)
			})
			return
		}

		const { secret } = selectedSecretData

		const request: UpdateSecretRequest = {
			secretSlug: secret.slug,
			name:
				requestData.name === secret.name || requestData.name === ''
					? undefined
					: requestData.name,
			note: requestData.note === '' ? undefined : requestData.note,
			entries: undefined
		}

		const { success, error, data } =
			await ControllerInstance.getInstance().secretController.updateSecret(
				request,
				{}
			)

		if (success && data) {
			toast.success('Secret edited successfully', {
				description: (
					<p className="text-xs text-emerald-300">
						You successfully edited the secret
					</p>
				)
			})

			// Update the secret in the store
			setSecrets((prev) => {
				const newSecrets = prev.map((s) => {
					if (s.secret.slug === secret.slug) {
						return {
							...s,
							secret: {
								...s.secret,
								name: requestData.name || s.secret.name,
								note: requestData.note || s.secret.note,
								slug: data.secret.slug
							}
						}
					}
					return s
				})
				return newSecrets
			})
		}
		if (error) {
			toast.error('Something went wrong!', {
				description: (
					<p className="text-xs text-red-300">
						Something went wrong while updating the secret. Check console for more info.
					</p>
				)
			})
			// eslint-disable-next-line no-console -- we need to log the error
			console.error('Error while updating secret: ', error)
		}

		handleClose()
	}, [selectedSecretData, requestData, handleClose, setSecrets])

	return (
		<Sheet
			onOpenChange={(open) => {
				setIsEditSecretSheetOpen(open)
			}}
			open={isEditSecretSheetOpen}
		>
			<SheetContent className="border-white/15 bg-[#222425]">
				<SheetHeader>
					<SheetTitle className="text-white">Edit this secret</SheetTitle>
					<SheetDescription className='text-white/60'>
						Edit the secret name or the note
					</SheetDescription>
				</SheetHeader>
				<div className="grid gap-x-4 gap-y-6 py-8">
					<div className="flex flex-col items-start gap-x-4 gap-y-3">
						<Label className="text-right" htmlFor="name">
							Secret Name
						</Label>
						<Input
							className='h-[2.75rem] col-span-3'
							id="name"
							placeholder="Enter the key of the secret"
							onChange={(e) => {
								setRequestData((prev) => ({
									...prev,
									name: e.target.value
								}))
							}}
							value={requestData.name}
						/>
					</div>

					<div className="flex flex-col items-start gap-x-4 gap-y-3">
						<Label className="text-right" htmlFor="name">
							Extra Note
						</Label>
						<Input
							className="h-[2.75rem] col-span-3"
							id="name"
							placeholder="Enter the note of the secret"
							onChange={(e) => {
								setRequestData((prev) => ({
									...prev,
									note: e.target.value
								}))
							}}
							value={requestData.note}
						/>
					</div>
				</div>
				<SheetFooter className='py-3'>
					<SheetClose asChild>
						<Button onClick={updateSecret} variant="secondary" className='font-semibold'>
							Edit Secret
						</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
