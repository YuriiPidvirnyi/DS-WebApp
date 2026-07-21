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
  let listOrdered = false
  let key = 0

  const flushList = () => {
    if (!listItems.length) return
    const cls = 'space-y-1 pl-4 marker:text-dental-primary-600'
    blocks.push(
      listOrdered ? (
        <ol key={`ol-${key++}`} className={`list-decimal ${cls}`}>
          {listItems}
        </ol>
      ) : (
        <ul key={`ul-${key++}`} className={`list-disc ${cls}`}>
          {listItems}
        </ul>
      )
    )
    listItems = []
  }

  const pushItem = (content: string, ordered: boolean) => {
    // Зміна типу списку (- → 1.) закриває попередній блок.
    if (listItems.length && listOrdered !== ordered) flushList()
    listOrdered = ordered
    listItems.push(
      <li key={`li-${key++}`}>{inlineNodes(content, `li${key}`)}</li>
    )
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const bullet = line.match(/^\s*(?:[-*•]|—)\s+(.*)$/)
    if (bullet) {
      pushItem(bullet[1], false)
      continue
    }
    // Нумеровані списки LLM видає навіть коли просиш без розмітки —
    // саме той сценарій, для якого існує цей захисний шар.
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (numbered) {
      pushItem(numbered[1], true)
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
