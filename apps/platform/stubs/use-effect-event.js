// stubs/use-effect-event.js
import * as React from 'react'

export function useEffectEvent(handler) {
  // keep ref to latest handler
  const handlerRef = React.useRef(handler)
  React.useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  // return a stable callback that always calls the latest handler
  return React.useCallback((...args) => {
    return handlerRef.current(...args)
  }, [])
}
