'use client'

import { Provider } from 'jotai'
import React from 'react'

function JotaiProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return <Provider>{children}</Provider>
}

export default JotaiProvider
