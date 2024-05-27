import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h1: ({ children }) => (
      <h1 className="text-brandBlue my-8 text-2xl md:text-3xl">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-brandBlue my-6 text-xl md:text-2xl">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-brandBlue my-4 text-lg md:text-xl">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="my-4 text-sm text-white/80 md:text-base">{children}</p>
    ),
    a: ({ children, href }) => (
      <a className="text-brandBlue underline" href={href}>
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="my-4 list-outside list-disc">{children}</ul>
    ),
    ol: ({ children }) => <ol className="my-4 list-decimal">{children}</ol>,
    li: ({ children }) => <li className="my-4 text-white/80">{children}</li>
  }
}
