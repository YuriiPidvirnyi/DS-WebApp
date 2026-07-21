import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderAssistantMessage } from './renderAssistantMessage'

/**
 * Регресія на баг зі скріншота власника (/contact): бабл AI-асистента
 * показував сирий Markdown — «### Терапія:», «**Пломбування зуба
 * (фотополімер)**: 1200 грн». Рендерер мусить перетворити це на
 * заголовок/список/жирний і не лишити жодного службового символа.
 */
describe('renderAssistantMessage', () => {
  const ownerScreenshotSample = [
    '### Терапія:',
    '- **Лікування карієсу (молочний зуб)**: 600 грн (60 хв)',
    '- **Пломбування зуба (фотополімер)**: 1200 грн (60 хв)',
    '',
    'Для запису зателефонуйте нам.',
  ].join('\n')

  it('не лишає сирих Markdown-символів', () => {
    const { container } = render(
      <>{renderAssistantMessage(ownerScreenshotSample)}</>
    )
    expect(container.textContent).not.toContain('#')
    expect(container.textContent).not.toContain('**')
  })

  it('### стає жирним рядком-заголовком', () => {
    render(<>{renderAssistantMessage(ownerScreenshotSample)}</>)
    const heading = screen.getByText('Терапія:')
    expect(heading.tagName).toBe('P')
    expect(heading.className).toContain('font-semibold')
  })

  it('дефісні рядки стають списком, **…** — strong', () => {
    const { container } = render(
      <>{renderAssistantMessage(ownerScreenshotSample)}</>
    )
    expect(container.querySelectorAll('li')).toHaveLength(2)
    const strong = screen.getByText('Лікування карієсу (молочний зуб)')
    expect(strong.tagName).toBe('STRONG')
    // Ціна лишається звичайним текстом того ж пункту.
    expect(strong.closest('li')?.textContent).toContain('600 грн (60 хв)')
  })

  it('«— » (формат із промпту) теж рендериться списком', () => {
    const { container } = render(
      <>{renderAssistantMessage('— Чистка: 1500 грн\n— Шинування: 2500 грн')}</>
    )
    expect(container.querySelectorAll('li')).toHaveLength(2)
  })

  it('нумерований список (1. / 2)) стає <ol> без сирих номерів у тексті', () => {
    const { container } = render(
      <>
        {renderAssistantMessage(
          'Кроки запису:\n1. Оберіть послугу\n2) Виберіть час'
        )}
      </>
    )
    const ol = container.querySelector('ol')
    expect(ol).not.toBeNull()
    expect(ol!.querySelectorAll('li')).toHaveLength(2)
    expect(ol!.textContent).toBe('Оберіть послугуВиберіть час')
  })

  it('зміна типу списку (- → 1.) закриває попередній блок', () => {
    const { container } = render(
      <>{renderAssistantMessage('- пункт\n1. крок')}</>
    )
    expect(container.querySelectorAll('ul')).toHaveLength(1)
    expect(container.querySelectorAll('ol')).toHaveLength(1)
  })

  it('звичайний текст без розмітки проходить без змін', () => {
    const { container } = render(
      <>{renderAssistantMessage('Добрий день! Чим можу допомогти?')}</>
    )
    expect(container.textContent).toBe('Добрий день! Чим можу допомогти?')
    expect(container.querySelector('ul')).toBeNull()
  })

  it('бектіки коду прибираються, текст зберігається', () => {
    const { container } = render(
      <>{renderAssistantMessage('Наберіть `+380682323838` для запису')}</>
    )
    expect(container.textContent).toBe('Наберіть +380682323838 для запису')
  })
})
