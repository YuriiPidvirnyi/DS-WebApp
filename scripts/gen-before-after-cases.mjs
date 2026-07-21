#!/usr/bin/env node
/**
 * Генерує брендовані ілюстрації «до/після» для слайдера кейсів
 * (BeforeAfterGallery): 7 кейсів × 2 фази → public/assets/images/before-after/
 * case-<id>-{before,after}.svg (1200×800, 3:2 — аспект слайдера).
 *
 * Це свідомо ілюстрації, а не фото: реальних клінічних пар «до/після» у
 * клініки поки немає (потрібна згода пацієнтів), а видавати чужі чи
 * згенеровані фото за реальні результати не можна. Стиль — плаский
 * клінічний вектор у бренд-палітрі, той самий пайплайн, що й тайли послуг
 * (генератор = джерело правди, тест ловить ручний дрифт).
 *
 * Запуск: node scripts/gen-before-after-cases.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// [id, kind] — id відповідає caseStudies.cases.<id> у локалях.
export const CASES = [
  ['1', 'veneers'],
  ['2', 'implant'],
  ['3', 'braces'],
  ['4', 'whitening'],
  ['5', 'restoration'],
  ['6', 'crown'],
  ['7', 'hygiene'],
]

const W = 1200
const H = 800
const CX = W / 2

// Бренд-палітра ілюстрацій (узгоджена з @theme у globals.css).
const BG_TOP = '#f4f9fa'
const BG_BOTTOM = '#e3eef0'
const GUM = '#e2988f'
const GUM_DARK = '#c97f76'
const TOOTH_WHITE = '#ffffff'
const TOOTH_IVORY = '#f2e8d2'
const TOOTH_YELLOW = '#eaddb6'
const TOOTH_DAMAGED = '#d9c39a'
const TARTAR = '#d8c07f'
const CRACK = '#a08a5f'
const SPARKLE = '#7fb3bc'
const OUTLINE = 'rgba(44,62,66,0.10)'

export const round2 = n => Math.round(n * 100) / 100

/** Контур зуба: верх ледь скруглений (ховається під ясна), низ — сильно. */
function toothPath(cx, top, w, h, rot = 0, dy = 0) {
  const rTop = 14
  const rBot = Math.min(40, w / 2 - 2)
  const x = -w / 2
  const y = 0
  const d = [
    `M ${round2(x + rTop)} ${y}`,
    `H ${round2(-x - rTop)}`,
    `Q ${round2(-x)} ${y} ${round2(-x)} ${rTop}`,
    `V ${round2(h - rBot)}`,
    `Q ${round2(-x)} ${h} ${round2(-x - rBot)} ${h}`,
    `H ${round2(x + rBot)}`,
    `Q ${round2(x)} ${h} ${round2(x)} ${round2(h - rBot)}`,
    `V ${rTop}`,
    `Q ${round2(x)} ${y} ${round2(x + rTop)} ${y}`,
    'Z',
  ].join(' ')
  return {
    d,
    transform: `translate(${round2(cx)} ${round2(top + dy)}) rotate(${rot})`,
  }
}

function star4(cx, cy, r, fill = SPARKLE, opacity = 0.9) {
  // round2 на КОЖНІЙ координаті: без нього в закомічені SVG текло
  // float-сміття типу 433.32000000000005 (зловив авто-рев'ю PR #384).
  const s = r * 0.28
  const p = n => round2(n)
  return `<path d="M ${p(cx)} ${p(cy - r)} Q ${p(cx + s)} ${p(cy - s)} ${p(cx + r)} ${p(cy)} Q ${p(cx + s)} ${p(cy + s)} ${p(cx)} ${p(cy + r)} Q ${p(cx - s)} ${p(cy + s)} ${p(cx - r)} ${p(cy)} Q ${p(cx - s)} ${p(cy - s)} ${p(cx)} ${p(cy - r)} Z" fill="${fill}" opacity="${opacity}"/>`
}

/**
 * Базова геометрія ряду: 6 зубів по пологій дузі; центральні довші.
 * mods[i] може перекрити { h, dy, rot, fill, missing, chip, crack, tartar,
 * sparkle } для конкретного зуба.
 */
function teethRow(phase, mods = {}) {
  const widths = [104, 112, 122, 122, 112, 104]
  const baseH = [198, 216, 236, 236, 216, 198]
  const gap = 10
  const gumline = 300
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * 5
  let x = CX - totalW / 2
  const baseFill = phase === 'after' ? TOOTH_WHITE : TOOTH_IVORY
  const parts = []
  for (let i = 0; i < 6; i++) {
    const m = mods[i] ?? {}
    const w = widths[i]
    const cx = x + w / 2
    x += w + gap
    if (m.missing) {
      // Порожня лунка: затемнена ніша в яснах на місці зуба.
      parts.push(
        `<ellipse cx="${round2(cx)}" cy="${gumline + 26}" rx="${round2(w / 2 - 8)}" ry="30" fill="${GUM_DARK}"/>`
      )
      continue
    }
    const { d, transform } = toothPath(
      cx,
      gumline - 34,
      w,
      m.h ?? baseH[i],
      m.rot ?? 0,
      m.dy ?? 0
    )
    parts.push(
      `<g transform="${transform}"><path d="${d}" fill="${m.fill ?? baseFill}" stroke="${OUTLINE}" stroke-width="2"/>`
    )
    if (m.chip) {
      // Скол нижнього кута — впевнений клин у колір підкладки.
      const h = m.h ?? baseH[i]
      parts.push(
        `<path d="M ${round2(-w / 2 - 2)} ${h - 74} L ${round2(-w / 2 + 60)} ${h + 2} L ${round2(-w / 2 - 2)} ${h + 2} Z" fill="${BG_BOTTOM}"/>`
      )
    }
    if (m.crack) {
      const h = m.h ?? baseH[i]
      parts.push(
        `<path d="M ${round2(w * 0.12)} ${h - 8} L ${round2(w * 0.02)} ${h - 62} L ${round2(w * 0.16)} ${h - 110}" fill="none" stroke="${CRACK}" stroke-width="4" stroke-linecap="round"/>`
      )
    }
    if (m.tartar) {
      parts.push(
        `<path d="M ${round2(-w / 2 + 6)} 26 Q 0 52 ${round2(w / 2 - 6)} 24 L ${round2(w / 2 - 6)} 2 L ${round2(-w / 2 + 6)} 2 Z" fill="${TARTAR}" opacity="0.85"/>`
      )
    }
    parts.push('</g>')
    if (m.sparkle) {
      // sparkle: true → дефолт; або {r, dx, dy} — «після» різних кейсів
      // навмисно відрізняються конфігурацією іскор (авто-рев'ю впіймало
      // побайтово однакові after-файли у кейсів зі спільною геометрією).
      const sp = m.sparkle === true ? {} : m.sparkle
      parts.push(
        star4(
          round2(cx + w * 0.3 + (sp.dx ?? 0)),
          round2(gumline + 64 + (sp.dy ?? 0)),
          sp.r ?? 26,
          SPARKLE,
          0.95
        )
      )
    }
  }
  return parts.join('\n    ')
}

/** Ясна поверх коренів; за потреби — легке запалення (фаза «до» гігієни). */
function gumBand(inflamed = false) {
  const fill = inflamed ? '#d98a80' : GUM
  return [
    `<path d="M 240 300 V 220 Q 240 128 340 128 H 860 Q 960 128 960 220 V 300 Q 780 270 600 270 Q 420 270 240 300 Z" fill="${fill}"/>`,
    `<path d="M 240 300 Q 420 258 600 258 Q 780 258 960 300 Q 780 282 600 282 Q 420 282 240 300 Z" fill="${GUM_DARK}" opacity="0.35"/>`,
  ].join('\n    ')
}

const CASE_MODS = {
  veneers: {
    before: {
      1: { dy: 8, h: 198 },
      2: { dy: -6, h: 218 },
      3: { dy: 10, h: 246 },
      4: { dy: -8, h: 198 },
      5: { dy: 6 },
    },
    after: {
      1: { sparkle: { r: 20, dy: -12 } },
      4: { sparkle: { r: 26, dy: 26 } },
    },
  },
  implant: {
    before: { 3: { missing: true }, 2: { rot: 3 }, 4: { rot: -3 } },
    after: { 3: { sparkle: { r: 30 } } },
  },
  braces: {
    before: {
      0: { rot: -4, dy: 5 },
      1: { rot: 3, dy: -6 },
      2: { rot: -5, dy: 8 },
      3: { rot: 4, dy: -5 },
      4: { rot: -3, dy: 6 },
      5: { rot: 4, dy: -3 },
    },
    after: {},
  },
  whitening: {
    before: Object.fromEntries(
      Array.from({ length: 6 }, (_, i) => [i, { fill: TOOTH_YELLOW }])
    ),
    after: { 1: { sparkle: { r: 24 } }, 4: { sparkle: { r: 24 } } },
  },
  restoration: {
    before: { 2: { chip: true, crack: true } },
    after: { 2: { sparkle: { r: 18, dx: -34, dy: 42 } } },
  },
  crown: {
    before: { 3: { fill: TOOTH_DAMAGED, crack: true, h: 210, dy: 6 } },
    after: { 3: { sparkle: { r: 24, dx: -38, dy: -8 } } },
  },
  hygiene: {
    before: {
      0: { tartar: true },
      1: { tartar: true },
      2: { tartar: true },
      4: { tartar: true },
      5: { tartar: true },
    },
    after: {
      0: { sparkle: { r: 18, dy: -22 } },
      5: { sparkle: { r: 18, dy: -22 } },
    },
  },
}

export function caseSvg(kind, phase) {
  const mods = CASE_MODS[kind][phase]
  const inflamedGum = kind === 'hygiene' && phase === 'before'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BG_TOP}"/>
      <stop offset="1" stop-color="${BG_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <ellipse cx="${CX}" cy="700" rx="330" ry="28" fill="#2c3e42" opacity="0.05"/>
  <g transform="translate(0 95)">
    ${teethRow(phase, mods)}
    ${gumBand(inflamedGum)}
  </g>
</svg>`
}

function main() {
  const dir = join(root, 'public/assets/images/before-after')
  mkdirSync(dir, { recursive: true })
  for (const [id, kind] of CASES) {
    for (const phase of ['before', 'after']) {
      writeFileSync(
        join(dir, `case-${id}-${phase}.svg`),
        caseSvg(kind, phase) + '\n'
      )
    }
  }
  console.log(`generated ${CASES.length * 2} case illustrations in ${dir}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
