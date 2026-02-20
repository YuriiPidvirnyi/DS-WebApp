import type { Meta, StoryObj } from '@storybook/nextjs'
import Services from '@/views/Services'

const meta = {
  title: 'Pages/Services',
  component: Services,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Services>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
