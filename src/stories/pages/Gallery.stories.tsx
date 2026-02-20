import type { Meta, StoryObj } from '@storybook/nextjs'
import Gallery from '@/views/Gallery'

const meta = {
  title: 'Pages/Gallery',
  component: Gallery,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Gallery>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ClinicCategory: Story = {
  play: async ({ canvasElement }) => {
    const clinicButton = Array.from(
      canvasElement.querySelectorAll('button')
    ).find(btn => btn.textContent?.includes('Клініка'))
    if (clinicButton) {
      ;(clinicButton as HTMLElement).click()
    }
  },
}

export const BeforeAfterCategory: Story = {
  play: async ({ canvasElement }) => {
    const beforeAfterButton = Array.from(
      canvasElement.querySelectorAll('button')
    ).find(btn => btn.textContent?.includes('До/Після'))
    if (beforeAfterButton) {
      ;(beforeAfterButton as HTMLElement).click()
    }
  },
}
