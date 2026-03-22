const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dentalstory.com.ua'
const CLINIC_PHONE = '+38 (044) 123-45-67'
const CLINIC_ADDRESS = 'м. Київ, вул. Стоматологічна, 1'

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

function baseLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="uk" dir="ltr">
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
                &copy; ${new Date().getFullYear()} DentalStory. Усі права захищено.
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

function formatDateUk(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('uk-UA', {
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

export function bookingConfirmationEmail(data: BookingConfirmationData) {
  const html = baseLayout(
    `
    <h1 style="margin:0 0 8px;font-size:22px;color:${COLORS.navy};">Запис підтверджено ✓</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${COLORS.text};">
      Дякуємо, ${data.patientName}! Ваш запис створено.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};width:120px;">Послуга</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${data.service}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Дата</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${formatDateUk(data.date)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Час</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${formatTime(data.time)}</td>
            </tr>
            ${data.doctorName ? `<tr><td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Лікар</td><td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${data.doctorName}</td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${SITE_URL}/cabinet" class="btn">Мій кабінет</a>
    </div>
    <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">
      Якщо потрібно змінити час — зателефонуйте ${CLINIC_PHONE}
    </p>
    `,
    `Ваш запис на ${formatDateUk(data.date)} о ${formatTime(data.time)} підтверджено`
  )

  const text = `Запис підтверджено

Дякуємо, ${data.patientName}! Ваш запис створено.

Послуга: ${data.service}
Дата: ${formatDateUk(data.date)}
Час: ${formatTime(data.time)}${data.doctorName ? `\nЛікар: ${data.doctorName}` : ''}

Якщо потрібно змінити час — зателефонуйте ${CLINIC_PHONE}

${SITE_URL}/cabinet`

  return {
    subject: `Запис підтверджено — ${formatDateUk(data.date)}, ${formatTime(data.time)}`,
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

export function appointmentReminderEmail(data: ReminderData) {
  const html = baseLayout(
    `
    <h1 style="margin:0 0 8px;font-size:22px;color:${COLORS.navy};">Нагадування про візит</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${COLORS.text};">
      ${data.patientName}, нагадуємо про ваш запис.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};width:120px;">Послуга</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${data.service}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Дата</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${formatDateUk(data.date)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Час</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${formatTime(data.time)}</td>
            </tr>
            ${data.doctorName ? `<tr><td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Лікар</td><td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${data.doctorName}</td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${SITE_URL}/cabinet" class="btn">Мій кабінет</a>
    </div>
    <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">
      Не зможете прийти? Зателефонуйте ${CLINIC_PHONE} щоб перенести візит.
    </p>
    `,
    `Нагадуємо: ${formatDateUk(data.date)} о ${formatTime(data.time)} — візит до DentalStory`
  )

  const text = `Нагадування про візит

${data.patientName}, нагадуємо про ваш запис.

Послуга: ${data.service}
Дата: ${formatDateUk(data.date)}
Час: ${formatTime(data.time)}${data.doctorName ? `\nЛікар: ${data.doctorName}` : ''}

Не зможете прийти? Зателефонуйте ${CLINIC_PHONE} щоб перенести візит.

${SITE_URL}/cabinet`

  return {
    subject: `Нагадування — ${formatDateUk(data.date)}, ${formatTime(data.time)}`,
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

export function appointmentCancellationEmail(data: CancellationData) {
  const html = baseLayout(
    `
    <h1 style="margin:0 0 8px;font-size:22px;color:${COLORS.navy};">Запис скасовано</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${COLORS.text};">
      ${data.patientName}, ваш запис було скасовано.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};width:120px;">Послуга</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${data.service}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Дата</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${formatDateUk(data.date)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Час</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${formatTime(data.time)}</td>
            </tr>
            ${data.reason ? `<tr><td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Причина</td><td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${data.reason}</td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${SITE_URL}/booking" class="btn" style="background-color:${COLORS.navy};">Записатися знову</a>
    </div>
    `,
    `Ваш запис на ${formatDateUk(data.date)} скасовано`
  )

  const text = `Запис скасовано

${data.patientName}, ваш запис було скасовано.

Послуга: ${data.service}
Дата: ${formatDateUk(data.date)}
Час: ${formatTime(data.time)}${data.reason ? `\nПричина: ${data.reason}` : ''}

Щоб записатися знову: ${SITE_URL}/booking`

  return {
    subject: `Запис скасовано — ${formatDateUk(data.date)}`,
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

export function newBookingAdminEmail(data: NewBookingAdminData) {
  const html = baseLayout(
    `
    <h1 style="margin:0 0 8px;font-size:22px;color:${COLORS.navy};">Новий запис з сайту</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};width:120px;">Пацієнт</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${data.patientName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Телефон</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${data.phone}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Email</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${data.email}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Послуга</td>
              <td style="padding:6px 0;font-size:15px;color:${COLORS.navy};">${data.service}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Дата</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${formatDateUk(data.date)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:${COLORS.text};">Час</td>
              <td style="padding:6px 0;font-size:15px;font-weight:600;color:${COLORS.navy};">${formatTime(data.time)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="text-align:center;">
      <a href="${SITE_URL}/admin?tab=appointments&filter=today" class="btn">Переглянути в адмін-панелі</a>
    </div>
    `,
    `Новий запис: ${data.patientName} — ${formatDateUk(data.date)}`
  )

  const text = `Новий запис з сайту

Пацієнт: ${data.patientName}
Телефон: ${data.phone}
Email: ${data.email}
Послуга: ${data.service}
Дата: ${formatDateUk(data.date)}
Час: ${formatTime(data.time)}

${SITE_URL}/admin?tab=appointments`

  return {
    subject: `Новий запис — ${data.patientName}, ${formatDateUk(data.date)}`,
    html,
    text,
  }
}
