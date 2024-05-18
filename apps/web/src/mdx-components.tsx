import type { MDXComponents } from 'mdx/types'
 
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h1: ({ children }) => (
      <h1 className="text-brandBlue text-2xl md:text-3xl my-8">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-brandBlue text-xl md:text-2xl my-6">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-brandBlue text-lg md:text-xl my-4">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-white/80 my-4 text-sm md:text-base">{children}</p>
    ),
    a: ({ children, href }) => (
      <a className="text-brandBlue underline" href={href}>
        {children}
      </a>
    ),
    ul: ({ children }) => <ul className="list-disc list-outside my-4">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal my-4">{children}</ol>,
    li: ({ children }) => <li className="text-white/80 my-4">{children}</li>,
  }
}