import React from 'react'

/**
 * Conditionally renders children based on the `if` prop.
 * If `if` is true, children are rendered; otherwise, nothing is rendered.
 * 
 * @param children - The content to render if the condition is true.
 * @param if - A boolean condition to determine visibility of children
 * 
 * @example
 * ```tsx
 * <Visible if={someCondition}>
 *   <div>Content to show conditionally</div>
 * </Visible>
 * ```
 */
export default function Visible({children, if: condition}: {children: React.ReactNode, if: unknown}): React.JSX.Element {
  return <>{condition ? children : null}</>
}
