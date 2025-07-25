import { useEffect, useState } from 'react'

export function useHighlight(
  highlightSlug: string | null,
  elementType = 'variable'
) {
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false)

  useEffect(() => {
    if (!highlightSlug) return

    const element = document.getElementById(`${elementType}-${highlightSlug}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setIsHighlighted(true)
      setTimeout(() => setIsHighlighted(false), 2000)
    }
  }, [highlightSlug, elementType])

  return { isHighlighted }
}
