// Utilities for creating and downloading calendar events (.ics)

export function formatDateToICS(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) + 'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) + 'Z'
  )
}

export function createICSEvent(options: {
  uid: string
  title: string
  description?: string
  location?: string
  start: Date
  end: Date
  url?: string
  organizer?: string
}) {
  const {
    uid, title, description = '', location = '', start, end, url = window.location.origin, organizer = 'noreply@example.com'
  } = options

  const dtstamp = formatDateToICS(new Date())
  const dtstart = formatDateToICS(start)
  const dtend = formatDateToICS(end)

  const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,|;/g, (m) => `\\${m}`)

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DS App//Booking//UA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escape(title)}`,
    description ? `DESCRIPTION:${escape(description)}` : '',
    location ? `LOCATION:${escape(location)}` : '',
    url ? `URL:${escape(url)}` : '',
    `ORGANIZER:mailto:${organizer}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')

  return ics
}

export function downloadICS(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
