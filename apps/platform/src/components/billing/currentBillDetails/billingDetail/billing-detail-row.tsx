import React from 'react'

interface BillingDetailRowProps {
  label: string
  value: string | number
  className?: string
}

export default function BillingDetailRow({ 
  label, 
  value, 
  className = '' 
}: BillingDetailRowProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-sm text-neutral-300">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}