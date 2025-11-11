import type { Meta, StoryObj } from '@storybook/react'
import ContactForm from '@/components/ContactForm'

const meta = {
  title: 'Forms/ContactForm',
  component: ContactForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ContactForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSuccess: () => console.log('Contact form submitted successfully'),
  },
}

export const WithCallback: Story = {
  args: {
    onSuccess: () => alert('Thank you for contacting us!'),
  },
}
