import * as React from 'react'
import { GlobalSVG, InternalSVG, PrivateSVG } from '@public/svg/dashboard'
import { cn } from '@/lib/utils'
import { GeistSansFont } from '@/fonts'

interface ProjectTagProps extends React.ComponentProps<'span'> {
  variant: 'private' | 'internal' | 'global'
}

function ProjectTag({
  className,
  variant = 'private',
  ...props
}: ProjectTagProps) {
  const projectTagVariant = {
    private: {
      name: 'Private',
      icon: <PrivateSVG />
    },
    internal: {
      name: 'Internal',
      icon: <InternalSVG />
    },
    global: {
      name: 'Global',
      icon: <GlobalSVG />
    }
  }
  return (
    <span
      className={cn(
        GeistSansFont.className,
        'border-white/16 flex w-[80px] items-center justify-center gap-x-1 rounded-md border-[0.4px] bg-zinc-900 py-2 text-xs',
        className
      )}
      data-slot="project-tag"
      {...props}
    >
      {projectTagVariant[variant].icon} {projectTagVariant[variant].name}
    </span>
  )
}

export { ProjectTag }
