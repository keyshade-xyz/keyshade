import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { ImportSVG } from '@public/svg/shared'
import ImportEnvModal from '../uploadEnvFile'
import ScanEnvModal from '../ScanEnvFile'
import { Button } from '@/components/ui/button'

export default function ImportEnvButton({ projectSlug }) {
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
    <div>
      <Button onClick={handleOpenModal} type="button" variant="outline">
        <ImportSVG />
        Import .env
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
  )
}
