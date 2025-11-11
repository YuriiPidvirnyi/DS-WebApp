import type { Meta, StoryObj } from '@storybook/react'
import { BrowserRouter } from 'react-router-dom'
import Services from '@/pages/Services'

const meta = {
  title: 'Pages/Services',
  component: Services,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof Services>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
