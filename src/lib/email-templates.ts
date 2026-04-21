const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dentalstory.ua'
const CLINIC_PHONE = '+38 (044) 123-45-67'
const CLINIC_ADDRESS = 'м. Київ, вул. Стоматологічна, 1'

type Locale = 'uk' | 'en' | 'pl'

const EMAIL_STRINGS: Record<
  Locale,
  {
    confirmed: string
    thanks: (name: string) => string
    service: string
    date: string
    time: string
    doctor: string
    myCabinet: string
    changeTime: (phone: string) => string
    confirmedSubject: (date: string, time: string) => string
    reminder: string
    reminderMsg: (name: string) => string
    cantCome: (phone: string) => string
    reminderSubject: (date: string, time: string) => string
    cancelled: string
    cancelledMsg: (name: string) => string
    reason: string
    bookAgain: string
    cancelledSubject: (date: string) => string
    newBooking: string
    patient: string
    phone: string
    email: string
    viewAdmin: string
    newBookingSubject: (name: string, date: string) => string
    copyright: (year: number) => string
  }
> = {
  uk: {
    confirmed: 'Запис підтверджено ✓',
    thanks: name => `Дякуємо, ${name}! Ваш запис створено.`,
    service: 'Послуга',
    date: 'Дата',
    time: 'Час',
    doctor: 'Лікар',
    myCabinet: 'Мій кабінет',
    changeTime: phone => `Якщо потрібно змінити час — зателефонуйте ${phone}`,
    confirmedSubject: (date, time) => `Запис підтверджено — ${date}, ${time}`,
    reminder: 'Нагадування про візит',
    reminderMsg: name => `${name}, нагадуємо про ваш запис.`,
    cantCome: phone =>
      `Не зможете прийти? Зателефонуйте ${phone} щоб перенести візит.`,
    reminderSubject: (date, time) => `Нагадування — ${date}, ${time}`,
    cancelled: 'Запис скасовано',
    cancelledMsg: name => `${name}, ваш запис було скасовано.`,
    reason: 'Причина',
    bookAgain: 'Записатися знову',
    cancelledSubject: date => `Запис скасовано — ${date}`,
    newBooking: 'Новий запис з сайту',
    patient: 'Пацієнт',
    phone: 'Телефон',
    email: 'Email',
    viewAdmin: 'Переглянути в адмін-панелі',
    newBookingSubject: (name, date) => `Новий запис — ${name}, ${date}`,
    copyright: year => `© ${year} DentalStory. Усі права захищено.`,
  },
  en: {
    confirmed: 'Appointment confirmed ✓',
    thanks: name => `Thank you, ${name}! Your appointment has been created.`,
    service: 'Service',
    date: 'Date',
    time: 'Time',
    doctor: 'Doctor',
    myCabinet: 'My Cabinet',
    changeTime: phone => `Need to reschedule? Please call us at ${phone}`,
    confirmedSubject: (date, time) =>
      `Appointment confirmed — ${date}, ${time}`,
    reminder: 'Appointment reminder',
    reminderMsg: name => `${name}, this is a reminder about your appointment.`,
    cantCome: phone => `Can't make it? Call ${phone} to reschedule.`,
    reminderSubject: (date, time) => `Reminder — ${date}, ${time}`,
    cancelled: 'Appointment cancelled',
    cancelledMsg: name => `${name}, your appointment has been cancelled.`,
    reason: 'Reason',
    bookAgain: 'Book again',
    cancelledSubject: date => `Appointment cancelled — ${date}`,
    newBooking: 'New online booking',
    patient: 'Patient',
    phone: 'Phone',
    email: 'Email',
    viewAdmin: 'View in admin panel',
    newBookingSubject: (name, date) => `New booking — ${name}, ${date}`,
    copyright: year => `© ${year} DentalStory. All rights reserved.`,
  },
  pl: {
    confirmed: 'Wizyta potwierdzona ✓',
    thanks: name => `Dziękujemy, ${name}! Twoja wizyta została utworzona.`,
    service: 'Usługa',
    date: 'Data',
    time: 'Godzina',
    doctor: 'Lekarz',
    myCabinet: 'Mój gabinet',
    changeTime: phone => `Chcesz zmienić termin? Zadzwoń pod numer ${phone}`,
    confirmedSubject: (date, time) => `Wizyta potwierdzona — ${date}, ${time}`,
    reminder: 'Przypomnienie o wizycie',
    reminderMsg: name => `${name}, przypominamy o Twojej wizycie.`,
    cantCome: phone =>
      `Nie możesz przyjść? Zadzwoń pod ${phone}, aby przełożyć wizytę.`,
    reminderSubject: (date, time) => `Przypomnienie — ${date}, ${time}`,
    cancelled: 'Wizyta anulowana',
    cancelledMsg: name => `${name}, Twoja wizyta została anulowana.`,
    reason: 'Powód',
    bookAgain: 'Zarezerwuj ponownie',
    cancelledSubject: date => `Wizyta anulowana — ${date}`,
    newBooking: 'Nowa rezerwacja ze strony',
    patient: 'Pacjent',
    phone: 'Telefon',
    email: 'Email',
    viewAdmin: 'Zobacz w panelu admina',
    newBookingSubject: (name, date) => `Nowa rezerwacja — ${name}, ${date}`,
    copyright: year => `© ${year} DentalStory. Wszelkie prawa zastrzeżone.`,
  },
}

const COLORS = {
  primary: '#AECED3',
  teal: '#5A8A94',
  navy: '#2C3E42',
  text: '#4A5E63',
  secondary: '#D1CAC0',
  bg: '#F8F9FA',
  white: '#FFFFFF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
}

function baseLayout(
  content: string,
  preheader?: string,
  locale: Locale = 'uk'
): string {
  const s = EMAIL_STRINGS[locale]
  return `<!DOCTYPE html>
<html lang="${locale}" dir="ltr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>DentalStory</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
    img { border: 0; line-height: 100%; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: ${COLORS.teal}; text-decoration: none; }
    .btn { display: inline-block; padding: 14px 32px; background-color: ${COLORS.teal}; color: #ffffff !important; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:24px 0;">
              <a href="${SITE_URL}" style="font-size:28px;font-weight:700;color:${COLORS.navy};letter-spacing:-0.5px;">
                Dental<span style="color:${COLORS.teal};">Story</span>
              </a>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:${COLORS.white};border-radius:12px;padding:40px 32px;border:1px solid ${COLORS.border};">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:${COLORS.text};">
                ${CLINIC_ADDRESS} &bull; <a href="tel:${CLINIC_PHONE.replace(/\s/g, '')}" style="color:${COLORS.teal};">${CLINIC_PHONE}</a>
              </p>
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                ${s.copyright(new Date().getFullYear())}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const LOCALE_DATE_MAP: Record<Locale, string> = {
  uk: 'uk-UA',
  en: 'en-GB',
  pl: 'pl-PL',
}

function formatDate(dateStr: string, locale: Locale = 'uk'): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(LOCALE_DATE_MAP[locale], {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTime(timeStr: string): string {
  return timeStr?.slice(0, 5) ?? timeStr
}

// ─── Booking Confirmation ─────────────────────────────────────────────────────

export type BookingConfirmationData = {
  patientName: string
  service: string
  date: string
  time: string
  appointmentId: string
  doctorName?: string
}

export function bookingConfirmationEmail(
  data: BookingConfirmationData,
  locale: Locale = 'uk'
) {
  const s = EMAIL_STRINGS[locale]
  const fmtDate = formatDate(data.date, locale)
  const fmtTime = formatTime(data.time)

  const html = baseLayout(
    `
    <h1 style="margin:0 0 8px;font-size:22px;color:${COLORS.navy};">${s.confirmed}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${COLORS.text};">
      ${s.thanks(data.patientName)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};width:120px;">${s.service}</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${data.service}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.date}</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${fmtDate}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.time}</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${fmtTime}</td>
            </tr>
            ${data.doctorName ? `<tr><td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.doctor}</td><td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${data.doctorName}</td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${SITE_URL}/cabinet" class="btn">${s.myCabinet}</a>
    </div>
    <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">
      ${s.changeTime(CLINIC_PHONE)}
    </p>
    `,
    `${s.confirmed} ${fmtDate} ${fmtTime}`,
    locale
  )

  const text = `${s.confirmed}

${s.thanks(data.patientName)}

${s.service}: ${data.service}
${s.date}: ${fmtDate}
${s.time}: ${fmtTime}${data.doctorName ? `\n${s.doctor}: ${data.doctorName}` : ''}

${s.changeTime(CLINIC_PHONE)}

${SITE_URL}/cabinet`

  return {
    subject: s.confirmedSubject(fmtDate, fmtTime),
    html,
    text,
  }
}

// ─── Appointment Reminder ─────────────────────────────────────────────────────

export type ReminderData = {
  patientName: string
  service: string
  date: string
  time: string
  appointmentId: string
  doctorName?: string
}

export function appointmentReminderEmail(
  data: ReminderData,
  locale: Locale = 'uk'
) {
  const s = EMAIL_STRINGS[locale]
  const fmtDate = formatDate(data.date, locale)
  const fmtTime = formatTime(data.time)

  const html = baseLayout(
    `
    <h1 style="margin:0 0 8px;font-size:22px;color:${COLORS.navy};">${s.reminder}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${COLORS.text};">
      ${s.reminderMsg(data.patientName)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};width:120px;">${s.service}</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${data.service}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.date}</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${fmtDate}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.time}</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${fmtTime}</td>
            </tr>
            ${data.doctorName ? `<tr><td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.doctor}</td><td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${data.doctorName}</td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${SITE_URL}/cabinet" class="btn">${s.myCabinet}</a>
    </div>
    <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">
      ${s.cantCome(CLINIC_PHONE)}
    </p>
    `,
    `${s.reminder}: ${fmtDate} ${fmtTime}`,
    locale
  )

  const text = `${s.reminder}

${s.reminderMsg(data.patientName)}

${s.service}: ${data.service}
${s.date}: ${fmtDate}
${s.time}: ${fmtTime}${data.doctorName ? `\n${s.doctor}: ${data.doctorName}` : ''}

${s.cantCome(CLINIC_PHONE)}

${SITE_URL}/cabinet`

  return {
    subject: s.reminderSubject(fmtDate, fmtTime),
    html,
    text,
  }
}

// ─── Cancellation ─────────────────────────────────────────────────────────────

export type CancellationData = {
  patientName: string
  service: string
  date: string
  time: string
  reason?: string
}

export function appointmentCancellationEmail(
  data: CancellationData,
  locale: Locale = 'uk'
) {
  const s = EMAIL_STRINGS[locale]
  const fmtDate = formatDate(data.date, locale)
  const fmtTime = formatTime(data.time)

  const html = baseLayout(
    `
    <h1 style="margin:0 0 8px;font-size:22px;color:${COLORS.navy};">${s.cancelled}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${COLORS.text};">
      ${s.cancelledMsg(data.patientName)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};width:120px;">${s.service}</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${data.service}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.date}</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${fmtDate}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.time}</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${fmtTime}</td>
            </tr>
            ${data.reason ? `<tr><td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.reason}</td><td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${data.reason}</td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${SITE_URL}/booking" class="btn" style="background-color:${COLORS.navy};">${s.bookAgain}</a>
    </div>
    `,
    `${s.cancelled} ${fmtDate}`,
    locale
  )

  const text = `${s.cancelled}

${s.cancelledMsg(data.patientName)}

${s.service}: ${data.service}
${s.date}: ${fmtDate}
${s.time}: ${fmtTime}${data.reason ? `\n${s.reason}: ${data.reason}` : ''}

${SITE_URL}/booking`

  return {
    subject: s.cancelledSubject(fmtDate),
    html,
    text,
  }
}

// ─── Admin notification about new booking ─────────────────────────────────────

export type NewBookingAdminData = {
  patientName: string
  phone: string
  email: string
  service: string
  date: string
  time: string
  appointmentId: string
}

export function newBookingAdminEmail(
  data: NewBookingAdminData,
  locale: Locale = 'uk'
) {
  const s = EMAIL_STRINGS[locale]
  const fmtDate = formatDate(data.date, locale)
  const fmtTime = formatTime(data.time)

  const html = baseLayout(
    `
    <h1 style="margin:0 0 8px;font-size:22px;color:${COLORS.navy};">${s.newBooking}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};width:120px;">${s.patient}</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${data.patientName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.phone}</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${data.phone}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.email}</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${data.email}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.service}</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${data.service}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.date}</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${fmtDate}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">${s.time}</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${fmtTime}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="text-align:center;">
      <a href="${SITE_URL}/admin?tab=appointments&filter=today" class="btn">${s.viewAdmin}</a>
    </div>
    `,
    `${s.newBooking}: ${data.patientName} — ${fmtDate}`,
    locale
  )

  const text = `${s.newBooking}

${s.patient}: ${data.patientName}
${s.phone}: ${data.phone}
${s.email}: ${data.email}
${s.service}: ${data.service}
${s.date}: ${fmtDate}
${s.time}: ${fmtTime}

${SITE_URL}/admin?tab=appointments`

  return {
    subject: s.newBookingSubject(data.patientName, fmtDate),
    html,
    text,
  }
}

// ─── Recall templates ────────────────────────────────────────────────────────

const RECALL_STRINGS: Record<
  Locale,
  {
    touch1Subject: string
    touch1Heading: string
    touch1Body: (name: string) => string
    touch2Subject: string
    touch2Heading: string
    touch2Body: (name: string) => string
    touch3Subject: string
    touch3Heading: string
    touch3Body: (name: string) => string
    bookNow: string
    optOut: string
  }
> = {
  uk: {
    touch1Subject: 'Час для планового огляду 🦷',
    touch1Heading: 'Час для вашого планового огляду',
    touch1Body: name =>
      `${name}, минуло понад 6 місяців з вашого останнього візиту. Регулярні огляди допомагають зберегти здоров'я зубів і виявляти проблеми на ранній стадії. Запишіться на зручний для вас час — це займе лише хвилину.`,
    touch2Subject: 'Ми відклали для вас зручні слоти 📅',
    touch2Heading: 'Зручні слоти для вашого огляду',
    touch2Body: name =>
      `${name}, у нас є чудові слоти цього тижня. Не відкладайте турботу про здоров'я зубів — запишіться прямо зараз.`,
    touch3Subject: 'Ми сумуємо за вами 💙',
    touch3Heading: 'Повертайтесь — ми завжди раді вас бачити',
    touch3Body: name =>
      `${name}, ваш стоматолог готовий до зустрічі. Запишіться на огляд — і ваші зуби скажуть вам «дякую».`,
    bookNow: 'Записатися на огляд',
    optOut: 'Відписатися від нагадувань',
  },
  en: {
    touch1Subject: 'Time for your check-up 🦷',
    touch1Heading: 'Time for your regular check-up',
    touch1Body: name =>
      `${name}, it's been over 6 months since your last visit. Regular check-ups help keep your teeth healthy and catch issues early. Book a time that works for you — it only takes a minute.`,
    touch2Subject: 'We have convenient slots for you 📅',
    touch2Heading: 'Great slots available this week',
    touch2Body: name =>
      `${name}, we have great availability this week. Don't put off your dental health — book now.`,
    touch3Subject: 'We miss you 💙',
    touch3Heading: "Come back — we're always happy to see you",
    touch3Body: name =>
      `${name}, your dentist is ready to see you. Schedule a check-up — your teeth will thank you.`,
    bookNow: 'Book a check-up',
    optOut: 'Unsubscribe from reminders',
  },
  pl: {
    touch1Subject: 'Czas na planowy przegląd 🦷',
    touch1Heading: 'Czas na Twój planowy przegląd',
    touch1Body: name =>
      `${name}, minęło ponad 6 miesięcy od ostatniej wizyty. Regularne przeglądy pomagają utrzymać zdrowie zębów i wykrywać problemy na wczesnym etapie. Umów wizytę w dogodnym terminie — zajmie to tylko chwilę.`,
    touch2Subject: 'Mamy dla Ciebie wygodne terminy 📅',
    touch2Heading: 'Dostępne terminy w tym tygodniu',
    touch2Body: name =>
      `${name}, mamy świetną dostępność w tym tygodniu. Nie odkładaj dbania o zdrowie zębów — umów wizytę już teraz.`,
    touch3Subject: 'Tęsknimy za Tobą 💙',
    touch3Heading: 'Wróć — zawsze cieszymy się z Twojej wizyty',
    touch3Body: name =>
      `${name}, Twój dentysta jest gotowy. Umów przegląd — Twoje zęby będą Ci wdzięczne.`,
    bookNow: 'Umów przegląd',
    optOut: 'Zrezygnuj z przypomnień',
  },
}

interface RecallEmailData {
  patientName: string
  touch: 1 | 2 | 3
}

export function recallEmail(
  data: RecallEmailData,
  locale: Locale = 'uk'
): { subject: string; html: string; text: string } {
  const s = RECALL_STRINGS[locale]
  const bookingUrl = `${SITE_URL}/booking`

  const subjectMap = {
    1: s.touch1Subject,
    2: s.touch2Subject,
    3: s.touch3Subject,
  }
  const headingMap = {
    1: s.touch1Heading,
    2: s.touch2Heading,
    3: s.touch3Heading,
  }
  const bodyMap = {
    1: s.touch1Body(data.patientName),
    2: s.touch2Body(data.patientName),
    3: s.touch3Body(data.patientName),
  }

  const subject = subjectMap[data.touch]
  const heading = headingMap[data.touch]
  const body = bodyMap[data.touch]

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:0}
.wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.header{background:#5A8A94;padding:32px 40px;color:#fff}
.header h1{margin:0;font-size:22px;line-height:1.3}
.body{padding:32px 40px}
.body p{color:#4A5E63;line-height:1.6;margin:0 0 24px}
.btn{display:inline-block;background:#5A8A94;color:#fff!important;padding:14px 32px;border-radius:8px;font-weight:600;text-decoration:none;font-size:15px}
.footer{padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center;color:#9ca3af;font-size:12px}
.opt-out{display:inline-block;margin-top:8px;color:#9ca3af;font-size:11px;text-decoration:underline}
</style></head><body>
<div class="wrap">
  <div class="header"><h1>${heading}</h1></div>
  <div class="body">
    <p>${body}</p>
    <a href="${bookingUrl}" class="btn">${s.bookNow}</a>
  </div>
  <div class="footer">
    <div>DentalStory · ${CLINIC_ADDRESS}</div>
    <a href="${SITE_URL}/cabinet/profile#notifications" class="opt-out">${s.optOut}</a>
  </div>
</div>
</body></html>`

  const text = `${heading}\n\n${body}\n\n${s.bookNow}: ${bookingUrl}\n\n${s.optOut}: ${SITE_URL}/cabinet/profile#notifications`

  return { subject, html, text }
}
