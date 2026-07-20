import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../public', import.meta.url))
mkdirSync(`${ROOT}/services`, { recursive: true })
mkdirSync(`${ROOT}/doctors`, { recursive: true })

// Brand palette (globals.css @theme)
const PRIMARY = '#AECED3'
const TEAL = '#3f6f79'
const NAVY = '#2C3E42'
const INK = '#2F5962'
const SECONDARY = '#D1CAC0'

// ── shared building blocks ────────────────────────────────────────────────
// A calm brand gradient + soft blobs, one identical treatment everywhere.
function backdrop(w, h, id) {
  return `
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${PRIMARY}"/>
      <stop offset="1" stop-color="${TEAL}"/>
    </linearGradient>
    <linearGradient id="tooth${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#eaf3f4"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg${id})"/>
  <circle cx="${w * 0.16}" cy="${h * 0.2}" r="${h * 0.22}" fill="#ffffff" opacity="0.08"/>
  <circle cx="${w * 0.88}" cy="${h * 0.86}" r="${h * 0.3}" fill="${NAVY}" opacity="0.07"/>`
}

// Stylised tooth silhouette, centered at (cx,cy), scale s.
function tooth(cx, cy, s, id) {
  const p = `M ${cx - 46 * s} ${cy - 40 * s}
    c ${-6 * s} ${-26 * s} ${20 * s} ${-44 * s} ${40 * s} ${-30 * s}
    c ${8 * s} ${6 * s} ${16 * s} ${6 * s} ${24 * s} 0
    c ${20 * s} ${-14 * s} ${46 * s} ${4 * s} ${40 * s} ${30 * s}
    c ${-4 * s} ${18 * s} ${-8 * s} ${34 * s} ${-14 * s} ${58 * s}
    c ${-5 * s} ${20 * s} ${-22 * s} ${22 * s} ${-26 * s} ${2 * s}
    c ${-3 * s} ${-14 * s} ${-15 * s} ${-14 * s} ${-18 * s} 0
    c ${-4 * s} ${20 * s} ${-21 * s} ${18 * s} ${-26 * s} ${-2 * s}
    c ${-6 * s} ${-24 * s} ${-10 * s} ${-40 * s} ${-14 * s} ${-58 * s} Z`
  return `<path d="${p.replace(/\s+/g, ' ')}" fill="url(#tooth${id})" stroke="${INK}" stroke-width="${3 * s}" stroke-linejoin="round"/>`
}

// small category glyph drawn over the tooth (kept minimal + consistent)
function glyph(kind, cx, cy, s) {
  const st = `stroke="${TEAL}" stroke-width="${3.2 * s}" fill="none" stroke-linecap="round" stroke-linejoin="round"`
  const stf = `fill="${TEAL}"`
  switch (kind) {
    case 'sparkle':
      return `<g ${st}><path d="M ${cx} ${cy - 20 * s} l ${5 * s} ${13 * s} l ${13 * s} ${5 * s} l ${-13 * s} ${5 * s} l ${-5 * s} ${13 * s} l ${-5 * s} ${-13 * s} l ${-13 * s} ${-5 * s} l ${13 * s} ${-5 * s} Z"/></g>`
    case 'fill':
      return `<circle cx="${cx}" cy="${cy}" r="${11 * s}" ${stf}/>`
    case 'fill2':
      return `<g ${stf}><circle cx="${cx - 12 * s}" cy="${cy}" r="${8 * s}"/><circle cx="${cx + 12 * s}" cy="${cy}" r="${8 * s}"/></g>`
    case 'root':
      return `<g ${st}><path d="M ${cx} ${cy - 16 * s} v ${34 * s}"/><path d="M ${cx} ${cy + 6 * s} l ${-9 * s} ${10 * s}"/><path d="M ${cx} ${cy + 6 * s} l ${9 * s} ${10 * s}"/></g>`
    case 'arrow':
      return `<g ${st}><path d="M ${cx} ${cy - 18 * s} v ${30 * s}"/><path d="M ${cx - 9 * s} ${cy + 2 * s} l ${9 * s} ${11 * s} l ${9 * s} ${-11 * s}"/></g>`
    case 'crown':
      return `<path d="M ${cx - 20 * s} ${cy + 12 * s} l ${-3 * s} ${-26 * s} l ${12 * s} ${11 * s} l ${11 * s} ${-16 * s} l ${11 * s} ${16 * s} l ${12 * s} ${-11 * s} l ${-3 * s} ${26 * s} Z" ${st} fill="${TEAL}" fill-opacity="0.18"/>`
    case 'shine':
      return `<g ${st}><path d="M ${cx - 3 * s} ${cy - 18 * s} q ${-14 * s} ${18 * s} 0 ${36 * s}"/><path d="M ${cx + 9 * s} ${cy - 12 * s} q ${-9 * s} ${12 * s} 0 ${24 * s}"/></g>`
    case 'screw':
      return `<g ${st}><path d="M ${cx} ${cy - 20 * s} v ${40 * s}"/><path d="M ${cx - 12 * s} ${cy - 10 * s} h ${24 * s}"/><path d="M ${cx - 12 * s} ${cy} h ${24 * s}"/><path d="M ${cx - 9 * s} ${cy + 10 * s} h ${18 * s}"/></g>`
    case 'braces':
      return `<g ${st}><path d="M ${cx - 22 * s} ${cy} h ${44 * s}"/><rect x="${cx - 20 * s}" y="${cy - 7 * s}" width="${12 * s}" height="${14 * s}" rx="${2 * s}"/><rect x="${cx - 6 * s}" y="${cy - 7 * s}" width="${12 * s}" height="${14 * s}" rx="${2 * s}"/><rect x="${cx + 8 * s}" y="${cy - 7 * s}" width="${12 * s}" height="${14 * s}" rx="${2 * s}"/></g>`
    case 'aligner':
      return `<g ${st}><path d="M ${cx - 20 * s} ${cy - 12 * s} q ${20 * s} ${-10 * s} ${40 * s} 0 v ${24 * s} q ${-20 * s} ${10 * s} ${-40 * s} 0 Z"/></g>`
    case 'search':
      return `<g ${st}><circle cx="${cx - 4 * s}" cy="${cy - 4 * s}" r="${13 * s}"/><path d="M ${cx + 6 * s} ${cy + 6 * s} l ${12 * s} ${12 * s}"/></g>`
    default:
      return ''
  }
}

function wordmark(w, h) {
  return `<g transform="translate(${w / 2},${h - 74})" text-anchor="middle">
    <text font-family="Nunito, Verdana, sans-serif" font-size="20" font-weight="700" fill="#ffffff" opacity="0.9" letter-spacing="1.5">DENTAL STORY</text>
  </g>`
}

// Language-neutral on purpose: no localized text is baked into the image
// (the service name is rendered by the app next to it, in the active locale).
// Differentiation comes from the per-category glyph; brand identity from the
// Latin wordmark.
function serviceSvg(_title, kind, i) {
  const W = 800,
    H = 600
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Dental Story service placeholder">
${backdrop(W, H, i)}
${tooth(W / 2, H * 0.45, 2.15, i)}
${glyph(kind, W / 2, H * 0.45, 2.15)}
${wordmark(W, H)}
</svg>`
}

function doctorSvg(name, i) {
  const W = 600,
    H = 720
  const initials = name
    .split(' ')
    .map(x => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  // Initials are the doctor's own (language-neutral); no localized caption is
  // baked in. Avatar is centered so a circular crop (e.g. the About cards)
  // frames it cleanly.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Dental Story doctor placeholder">
${backdrop(W, H, 'd' + i)}
<g transform="translate(${W / 2},${H * 0.47})">
  <circle r="150" fill="#ffffff" opacity="0.16"/>
  <circle r="112" cy="-6" fill="url(#toothd${i})"/>
  <circle cy="-34" r="48" fill="${INK}" opacity="0.55"/>
  <path d="M -76 78 a 76 68 0 0 1 152 0 Z" fill="${INK}" opacity="0.55"/>
  <text y="12" text-anchor="middle" font-family="Nunito, Verdana, sans-serif" font-size="80" font-weight="800" fill="#ffffff" opacity="0.92">${initials}</text>
</g>
${wordmark(W, H)}
</svg>`
}

const SERVICES = [
  ['consultation', 'Консультація', 'search'],
  ['cleaning', 'Професійна чистка', 'sparkle'],
  ['cavity-1surface', 'Лікування карієсу', 'fill'],
  ['cavity-2plus', 'Карієс 2+ поверхні', 'fill2'],
  ['pulpitis', 'Лікування пульпіту', 'root'],
  ['extraction-simple', 'Видалення (просте)', 'arrow'],
  ['extraction-complex', 'Видалення (складне)', 'arrow'],
  ['crown-metalceramic', 'Металокерамічна коронка', 'crown'],
  ['crown-zirconia', 'Цирконієва коронка', 'crown'],
  ['veneer', 'Вінір керамічний', 'shine'],
  ['implant-mis', 'Імплантація (MIS)', 'screw'],
  ['implant-straumann', 'Імплантація (Straumann)', 'screw'],
  ['braces-metal', 'Брекети (металеві)', 'braces'],
  ['braces-ceramic', 'Брекети (керамічні)', 'braces'],
  ['aligners', 'Елайнери', 'aligner'],
]
const DOCTORS = [
  ['andrii-melnyk', 'Андрій Мельник'],
  ['dmytro-bondarenko', 'Дмитро Бондаренко'],
  ['mariia-shevchenko', 'Марія Шевченко'],
  ['olena-kovalenko', 'Олена Коваленко'],
]

SERVICES.forEach(([slug, title, kind], i) => {
  writeFileSync(
    `${ROOT}/services/${slug}.svg`,
    serviceSvg(title, kind, i) + '\n'
  )
})
DOCTORS.forEach(([slug, name], i) => {
  writeFileSync(`${ROOT}/doctors/${slug}.svg`, doctorSvg(name, i) + '\n')
})
console.log(
  `Generated ${SERVICES.length} service + ${DOCTORS.length} doctor SVGs`
)
