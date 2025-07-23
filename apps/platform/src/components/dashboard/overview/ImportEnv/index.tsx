import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'
import ImportEnvModal from '../uploadEnvFile'
import ScanEnvModal from '../ScanEnvFile'
import { Button } from '@/components/ui/button'

function ImportEnvButton({ projectSlug }): React.JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [fileContent, setFileContent] = useState<string>('')

  const handleFileUpload = useCallback((file: File, content: string) => {
    setFileContent(content)
    toast.success(`Successfully imported ${file.name}`)
    setIsModalOpen(false)
    setIsScanModalOpen(true)
  }, [])

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  return (
    <div className="flex h-fit justify-between gap-1 rounded-2xl bg-white/5 p-4 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-white">
          Import your configurations
        </h1>
        <p className="text-sm text-white/60">
          Sync your local configurations in your projects with a single click
        </p>
      </div>
      <div>
        <Button
          className="flex w-fit px-3 py-4 text-sm"
          onClick={handleOpenModal}
          type="button"
          variant="secondary"
        >
          Get started
        </Button>

        <ImportEnvModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onFileUpload={handleFileUpload}
        />

        <ScanEnvModal
          content={fileContent}
          isOpen={isScanModalOpen}
          onClose={() => setIsScanModalOpen(false)}
          projectSlug={projectSlug}
        />
      </div>
    </div>
  )
}

export default ImportEnvButton
