import type { Meta, StoryObj } from '@storybook/nextjs'
import { Badge } from '@/components/ui/badge'

const meta = {
  title: 'Badge',
  component: Badge,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered'
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs']
  //   args: { onClick: fn() }
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Solid: Story = {
  args: {
    variant: 'solid',
    color: 'red',
    type: 'none',
    children: 'Badge'
  }
}
