import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
    isLoading: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Записатися на прийом',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Дізнатися більше',
    variant: 'secondary',
  },
}

export const Outline: Story = {
  args: {
    children: 'Скасувати',
    variant: 'outline',
  },
}

export const Ghost: Story = {
  args: {
    children: 'Пропустити',
    variant: 'ghost',
  },
}

export const Ghost2: Story = {
  args: {
    children: 'Відкласти',
    variant: 'ghost',
  },
}

export const Small: Story = {
  args: {
    children: 'Маленька кнопка',
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    children: 'Велика кнопка',
    size: 'lg',
  },
}

export const Loading: Story = {
  args: {
    children: 'Завантаження...',
    isLoading: true,
  },
}

export const Disabled: Story = {
  args: {
    children: 'Недоступно',
    disabled: true,
  },
}
