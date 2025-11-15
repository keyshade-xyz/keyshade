import type { Meta, StoryObj } from '@storybook/nextjs'
import { ProjectTag } from '@/components/ui/project-tag'

const meta = {
  title: 'ProjectTag',
  component: ProjectTag,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered'
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs']
  //   args: { onClick: fn() }
} satisfies Meta<typeof ProjectTag>

export default meta

type Story = StoryObj<typeof meta>

export const Private: Story = {
  args: {
    variant: 'private'
  }
}

export const Internal: Story = {
  args: {
    variant: 'internal'
  }
}

export const Global: Story = {
  args: {
    variant: 'global'
  }
}
