import type { Meta, StoryObj } from '@storybook/nextjs'
import PriceCalculator from '@/components/PriceCalculator'
import { Toaster } from 'react-hot-toast'

const meta = {
  title: 'Components/PriceCalculator',
  component: PriceCalculator,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    Story => (
      <>
        <Toaster position="top-right" />
        <Story />
      </>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof PriceCalculator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
