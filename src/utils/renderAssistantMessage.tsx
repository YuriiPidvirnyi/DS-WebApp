import type { ReactNode } from 'react'

/**
 * Захисний рендерер відповіді AI-асистента: LLM попри інструкцію може
 * повернути Markdown, а бабл показував його буквально («### Терапія:»,
 * «**Пломбування**») — власник упіймав це на /contact. Промпт тепер
 * забороняє розмітку (route.ts, правило 7), а цей рендерер страхує:
 * підтримує мінімальний підсенс Markdown у бренд-типографіці й прибирає
 * решту службових символів. Без dangerouslySetInnerHTML — тільки React-вузли.
 */

/** Інлайни одного рядка: **жирний** → <strong>, `код` → текст без бектіків. */
function inlineNodes(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Розбиття по **...**: непарні індекси — вміст жирних сегментів.
  const parts = text.split(/\*\*([^*]+)\*\*/g)
  parts.forEach((part, i) => {
    const cleaned = part.replace(/`([^`]+)`/g, '$1')
    if (!cleaned) return
    if (i % 2 === 1) {
      nodes.push(
        <strong key={`${keyBase}-b${i}`} className="font-semibold">
          {cleaned}
        </strong>
      )
    } else {
      nodes.push(cleaned)
    }
  })
  return nodes
}

export function renderAssistantMessage(text: string): ReactNode {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let listItems: ReactNode[] = []
  let key = 0

  const flushList = () => {
    if (!listItems.length) return
    blocks.push(
      <ul
        key={`ul-${key++}`}
        className="list-disc space-y-1 pl-4 marker:text-dental-primary-600"
      >
        {listItems}
      </ul>
    )
    listItems = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const bullet = line.match(/^\s*(?:[-*•]|—)\s+(.*)$/)
    if (bullet) {
      listItems.push(
        <li key={`li-${key++}`}>{inlineNodes(bullet[1], `li${key}`)}</li>
      )
      continue
    }
    flushList()
    if (!line.trim()) continue // порожні рядки → інтервал дає space-y контейнера
    const heading = line.match(/^\s*#{1,6}\s+(.*)$/)
    if (heading) {
      blocks.push(
        <p key={`h-${key++}`} className="pt-1 font-semibold text-dental-dark">
          {inlineNodes(heading[1], `h${key}`)}
        </p>
      )
      continue
    }
    blocks.push(<p key={`p-${key++}`}>{inlineNodes(line, `p${key}`)}</p>)
  }
  flushList()

  return <div className="space-y-1.5">{blocks}</div>
}
