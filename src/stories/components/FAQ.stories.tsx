import type { Meta, StoryObj } from '@storybook/nextjs'
import FAQ from '@/components/FAQ'

const meta = {
  title: 'Components/FAQ',
  component: FAQ,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FAQ>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
