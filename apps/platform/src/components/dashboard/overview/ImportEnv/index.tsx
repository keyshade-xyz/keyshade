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
    <>
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
    </>
  )
}

export default ImportEnvButton
