import type { Meta, StoryObj } from '@storybook/react'
import { BrowserRouter } from 'react-router-dom'
import Header from '@/components/Header'

const meta = {
  title: 'Layout/Header',
  component: Header,
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
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithMobileMenu: Story = {
  play: async ({ canvasElement }) => {
    const menuButton = canvasElement.querySelector('button[aria-label*="меню"]')
    if (menuButton) {
      ;(menuButton as HTMLElement).click()
    }
  },
}
