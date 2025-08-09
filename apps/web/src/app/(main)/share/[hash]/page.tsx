'use client'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import PromotionBanner from '@/components/shareScention/PromotionBanner'
import SharePageHeader from '@/components/shareScention/sharePageHeader'
import SharePageWrapper from '@/components/shareScention/sharePageWrapper'
import ShareSecretAlert from '@/components/shareScention/ShareSecretAlert'
import ShareSecretBodyWrapper from '@/components/shareScention/shareSecretBodyWrapper'
import ViewShareSecret from '@/components/shareScention/viewSharedSecret'

function ViewSharePage() {
  const shareHash = useParams().hash as string
  const [error, setError] = useState<string>('')

  return (
    <>
      <SharePageWrapper>
        <SharePageHeader />
        <ShareSecretBodyWrapper>
          <ViewShareSecret secretHash={shareHash} setError={setError} />
        </ShareSecretBodyWrapper>
        <PromotionBanner />
      </SharePageWrapper>
      {error.trim() && <ShareSecretAlert alert={error} />}
    </>
  )
}

export default ViewSharePage
