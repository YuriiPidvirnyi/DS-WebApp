import type { Meta, StoryObj } from '@storybook/nextjs'
import BookingForm from '@/components/BookingForm'

const meta = {
  title: 'Forms/BookingForm',
  component: BookingForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="w-full max-w-4xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BookingForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
