import React from 'react'

export default function DetailContainer({
  children
}: {
  children: React.ReactNode
}) {
  return <div className="flex flex-col gap-3 rounded-xl bg-white/5 px-6 py-9">{children}</div>
}
