import React, { useCallback, useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface ImportEnvModalProps {
  isOpen: boolean
  onClose: () => void
  onFileUpload: (file: File, content: string) => void
}

function ImportEnvModal({
  isOpen,
  onClose,
  onFileUpload
}: ImportEnvModalProps): React.JSX.Element {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const processFile = useCallback(
    async (file: File) => {
      if (!(file.name.endsWith('.env') || file.name.endsWith('.txt'))) {
        toast.error('Please select a valid .env or .txt file')
        return
      }

      try {
        const content = await file.text()
        onFileUpload(file, content)
      } catch (error) {
        toast.error('Error reading file')
      }
    },
    [onFileUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        processFile(files[0])
      }
    },
    [processFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        processFile(files[0])
      }
    },
    [processFile]
  )

  const handleChooseFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <AlertDialog onOpenChange={onClose} open={isOpen}>
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#1E1E1F]">
        <AlertDialogHeader className="border-b border-white/20 pb-4">
          <AlertDialogTitle className="text-xl font-semibold">
            Drop your .env file
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-gray-400">
            Upload your .env or .txt file
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Drop Zone */}
        <div
          className={`rounded-lg border-2 p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-500 bg-opacity-10'
              : 'border-white/20 hover:border-white/40'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto mb-4 text-gray-400" size={32} />
          <p className="mb-2 text-gray-300">Drag and drop your files here</p>
          <p className="mb-4 text-sm text-gray-500">
            Upload your .env or .txt file
          </p>

          <Button
            className="bg-white/80 text-black hover:bg-white/60"
            onClick={handleChooseFile}
            variant="secondary"
          >
            Choose file
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          accept=".env,.txt,text/plain"
          className="hidden"
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />

        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md border border-white/60 text-white/60"
            onClick={onClose}
          >
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ImportEnvModal
