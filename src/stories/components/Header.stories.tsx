import type { Meta, StoryObj } from '@storybook/nextjs'
import Header from '@/components/Header'

// @storybook/nextjs provides next/navigation mocks automatically — no BrowserRouter needed
const meta = {
  title: 'Layout/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
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
