import type { Meta, StoryObj } from '@storybook/nextjs'
import { fn } from 'storybook/test'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'Button',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered'
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  args: { onClick: fn() }
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
    disabled: false
  }
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
    disabled: false
  }
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Button',
    disabled: false
  }
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Button',
    disabled: false
  }
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Button',
    disabled: false
  }
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Button',
    disabled: false
  }
}
