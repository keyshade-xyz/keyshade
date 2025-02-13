'use client'

import { ErrorBoundary } from 'next/dist/client/components/error-boundary'
import Error from 'next/error'
import React, { Suspense } from 'react'

function ErrorComponent() {
  return <Error statusCode={404} />
}

function RolesPage(): React.JSX.Element {
  return (
    <ErrorBoundary errorComponent={ErrorComponent}>
      <Suspense fallback={<div>Loading...</div>}>
        <div>undefined roles</div>
      </Suspense>
    </ErrorBoundary>
  )
}

export default RolesPage
