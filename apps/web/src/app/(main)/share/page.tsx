'use client'
import { useState } from 'react'
import GenerateSecretForm from '@/components/shareScention/generateSecretForm'
import PromotionBanner from '@/components/shareScention/PromotionBanner'
import SharePageHeader from '@/components/shareScention/sharePageHeader'
import SharePageWrapper from '@/components/shareScention/sharePageWrapper'
import ShareSecretBodyWrapper from '@/components/shareScention/shareSecretBodyWrapper'
import ShareSecretLink from '@/components/shareScention/shareSecretLink'

function SharePage() {
  const [shareHash, setShareHash] = useState<string>('')
  return (
    <SharePageWrapper>
      <SharePageHeader />
      <ShareSecretBodyWrapper>
        {shareHash ? (
          <ShareSecretLink shareHash={shareHash} />
        ) : (
          <GenerateSecretForm generatedShareHash={setShareHash} />
        )}
      </ShareSecretBodyWrapper>
      <PromotionBanner />
    </SharePageWrapper>
  )
}
export default SharePage
