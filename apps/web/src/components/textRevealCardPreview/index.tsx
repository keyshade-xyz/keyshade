'use client'
import React from 'react'
import {
  TextRevealCard,
  TextRevealCardDescription,
  TextRevealCardTitle
} from '../ui/text-reveal-card'

export function TextRevealCardPreview(): React.JSX.Element {
  return (
    <div className="flex h-[40rem] w-full items-center justify-center ">
      <TextRevealCard
        revealText="Shuush! This is a secret!"
        text="AWS_ACCESS=2vEqb5Z2CDE+HAzq4u3fMbEXAMPLEmK6EIGGjx0t"
      >
        <TextRevealCardTitle>Rethink privacy with us.</TextRevealCardTitle>
        <TextRevealCardDescription>
          This is a text reveal card. Hover over the card to reveal the hidden
          text.
        </TextRevealCardDescription>
      </TextRevealCard>
    </div>
  )
}
