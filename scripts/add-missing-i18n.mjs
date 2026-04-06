import { readFileSync, writeFileSync } from 'fs'

function deepMerge(target, source) {
  const result = { ...target }
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && result[k] && typeof result[k] === 'object') {
      result[k] = deepMerge(result[k], v)
    } else if (!(k in result)) {
      result[k] = v
    }
  }
  return result
}

const additions = {
  uk: {
    common: {
      confirm: 'Підтвердити',
      actions: 'Дії',
    },
    admin: {
      users: {
        title: 'Управління користувачами',
        subtitle: 'Ролі та права доступу адмін-панелі',
        columns: {
          name: "Ім'я",
          role: 'Роль',
          specialization: 'Спеціалізація',
          lastLogin: 'Останній вхід',
        },
        you: 'ви',
        deleteConfirm: 'Видалити цього користувача?',
        empty: 'Немає користувачів',
        note: 'Зміни ролей набувають чинності при наступному вході в систему.',
      },
    },
    cabinet: {
      title: 'Кабінет пацієнта',
      profileTitle: 'Мій профіль',
      appointmentsTitle: 'Мої записи',
      treatmentsTitle: 'Лікування',
      paymentsTitle: 'Платежі',
      greeting: {
        morning: 'Доброго ранку, {{name}}!',
        afternoon: 'Доброго дня, {{name}}!',
        evening: 'Доброго вечора, {{name}}!',
      },
      dashboard: {
        nextAppointment: 'Наступний запис',
        upcoming: 'Майбутніх',
        completed: 'Завершених',
        total: 'Усього записів',
        noUpcoming: 'Немає запланованих записів',
        noUpcomingDesc: 'Запишіться до лікаря у зручний для вас час',
        viewDetails: 'Переглянути',
        profileIncomplete: 'Заповніть профіль',
        profileHint: 'Повна інформація допомагає лікарям краще підготуватися до прийому',
        completeProfile: 'Заповнити профіль',
      },
      error: {
        title: 'Щось пішло не так',
        description: 'Не вдалося завантажити дані. Спробуйте оновити сторінку.',
        retry: 'Спробувати знову',
        goHome: 'На головну',
        devDetails: 'Деталі помилки',
      },
      sidebar: {
        title: 'Кабінет пацієнта',
        dashboard: 'Головна',
        appointments: 'Мої записи',
        treatments: 'Лікування',
        payments: 'Платежі',
        profile: 'Профіль',
        soon: 'Скоро',
        navigation: 'Навігація кабінету',
        openMenu: 'Відкрити меню',
        backToSite: 'На сайт',
      },
      appointments: {
        cancelModal: {
          title: 'Скасувати запис?',
          confirm: 'Так, скасувати',
          back: 'Не скасовувати',
          success: 'Запис скасовано',
          error: 'Не вдалося скасувати запис',
        },
        reschedule: {
          title: 'Перенести запис',
          button: 'Перенести',
          current: 'Поточний запис',
          selectTime: 'Оберіть новий час',
          noSlots: 'Немає доступних слотів',
          confirm: 'Підтвердити перенесення',
          success: 'Запис успішно перенесено',
          error: 'Не вдалося перенести запис',
          at: 'о',
        },
      },
      treatments: {
        title: 'Лікування',
        empty: 'Записів про лікування ще немає',
        doctor: 'Лікар',
        diagnosis: 'Діагноз',
        procedures: 'Процедури',
        teeth: 'Зуби',
        tooth: 'зуб',
        status: {
          draft: 'Чернетка',
          signed: 'Підписано',
          completed: 'Завершено',
        },
        payment: {
          unpaid: 'Не оплачено',
          partial: 'Часткова оплата',
          paid: 'Оплачено',
          waived: 'Списано',
          refunded: 'Повернено',
        },
      },
      payments: {
        title: 'Платежі',
        comingSoon: 'Скоро',
        description: 'Онлайн оплата послуг клініки вже у розробці.',
        feature1Title: 'Рахунки',
        feature1Desc: 'Перегляд виставлених рахунків',
        feature2Title: 'Оплата',
        feature2Desc: 'Зручна онлайн-оплата',
        feature3Title: 'Нагадування',
        feature3Desc: 'Сповіщення про платежі',
        meanwhile: 'Наразі оплата здійснюється у клініці.',
      },
      profile: {
        personalInfo: 'Особисті дані',
        contactInfo: 'Контактна інформація',
        additionalInfo: 'Додаткова інформація',
        unsavedChanges: 'Є незбережені зміни',
      },
    },
  },
  en: {
    common: {
      confirm: 'Confirm',
      actions: 'Actions',
    },
    admin: {
      users: {
        title: 'User Management',
        subtitle: 'Admin panel roles and access rights',
        columns: {
          name: 'Name',
          role: 'Role',
          specialization: 'Specialization',
          lastLogin: 'Last login',
        },
        you: 'you',
        deleteConfirm: 'Delete this user?',
        empty: 'No users found',
        note: 'Role changes take effect on next login.',
      },
    },
    cabinet: {
      title: 'Patient Cabinet',
      profileTitle: 'My Profile',
      appointmentsTitle: 'My Appointments',
      treatmentsTitle: 'Treatments',
      paymentsTitle: 'Payments',
      greeting: {
        morning: 'Good morning, {{name}}!',
        afternoon: 'Good afternoon, {{name}}!',
        evening: 'Good evening, {{name}}!',
      },
      dashboard: {
        nextAppointment: 'Next Appointment',
        upcoming: 'Upcoming',
        completed: 'Completed',
        total: 'Total appointments',
        noUpcoming: 'No upcoming appointments',
        noUpcomingDesc: 'Book an appointment at a convenient time',
        viewDetails: 'View details',
        profileIncomplete: 'Complete your profile',
        profileHint: 'Full information helps doctors prepare better for your appointment',
        completeProfile: 'Complete profile',
      },
      error: {
        title: 'Something went wrong',
        description: 'Failed to load data. Please try refreshing the page.',
        retry: 'Try again',
        goHome: 'Go home',
        devDetails: 'Error details',
      },
      sidebar: {
        title: 'Patient Cabinet',
        dashboard: 'Dashboard',
        appointments: 'My Appointments',
        treatments: 'Treatments',
        payments: 'Payments',
        profile: 'Profile',
        soon: 'Soon',
        navigation: 'Cabinet navigation',
        openMenu: 'Open menu',
        backToSite: 'Back to site',
      },
      appointments: {
        cancelModal: {
          title: 'Cancel appointment?',
          confirm: 'Yes, cancel',
          back: 'Keep appointment',
          success: 'Appointment cancelled',
          error: 'Failed to cancel appointment',
        },
        reschedule: {
          title: 'Reschedule appointment',
          button: 'Reschedule',
          current: 'Current appointment',
          selectTime: 'Select a new time',
          noSlots: 'No available slots',
          confirm: 'Confirm reschedule',
          success: 'Appointment successfully rescheduled',
          error: 'Failed to reschedule appointment',
          at: 'at',
        },
      },
      treatments: {
        title: 'Treatments',
        empty: 'No treatment records yet',
        doctor: 'Doctor',
        diagnosis: 'Diagnosis',
        procedures: 'Procedures',
        teeth: 'Teeth',
        tooth: 'tooth',
        status: {
          draft: 'Draft',
          signed: 'Signed',
          completed: 'Completed',
        },
        payment: {
          unpaid: 'Unpaid',
          partial: 'Partial payment',
          paid: 'Paid',
          waived: 'Waived',
          refunded: 'Refunded',
        },
      },
      payments: {
        title: 'Payments',
        comingSoon: 'Coming soon',
        description: 'Online payment for clinic services is coming soon.',
        feature1Title: 'Invoices',
        feature1Desc: 'View your invoices',
        feature2Title: 'Payment',
        feature2Desc: 'Convenient online payment',
        feature3Title: 'Reminders',
        feature3Desc: 'Payment notifications',
        meanwhile: 'Currently, payment is made at the clinic.',
      },
      profile: {
        personalInfo: 'Personal information',
        contactInfo: 'Contact information',
        additionalInfo: 'Additional information',
        unsavedChanges: 'You have unsaved changes',
      },
    },
  },
  pl: {
    common: {
      confirm: 'Potwierdź',
      actions: 'Akcje',
    },
    admin: {
      users: {
        title: 'Zarządzanie użytkownikami',
        subtitle: 'Role i prawa dostępu panelu admina',
        columns: {
          name: 'Imię',
          role: 'Rola',
          specialization: 'Specjalizacja',
          lastLogin: 'Ostatnie logowanie',
        },
        you: 'ty',
        deleteConfirm: 'Usuń tego użytkownika?',
        empty: 'Brak użytkowników',
        note: 'Zmiany ról wchodzą w życie przy następnym logowaniu.',
      },
    },
    cabinet: {
      title: 'Gabinet pacjenta',
      profileTitle: 'Mój profil',
      appointmentsTitle: 'Moje wizyty',
      treatmentsTitle: 'Leczenie',
      paymentsTitle: 'Płatności',
      greeting: {
        morning: 'Dzień dobry, {{name}}!',
        afternoon: 'Miłego dnia, {{name}}!',
        evening: 'Dobry wieczór, {{name}}!',
      },
      dashboard: {
        nextAppointment: 'Następna wizyta',
        upcoming: 'Nadchodzących',
        completed: 'Zakończonych',
        total: 'Łącznie wizyt',
        noUpcoming: 'Brak zaplanowanych wizyt',
        noUpcomingDesc: 'Umów wizytę w dogodnym terminie',
        viewDetails: 'Szczegóły',
        profileIncomplete: 'Uzupełnij profil',
        profileHint: 'Pełne informacje pomagają lekarzom lepiej przygotować się do wizyty',
        completeProfile: 'Uzupełnij profil',
      },
      error: {
        title: 'Coś poszło nie tak',
        description: 'Nie udało się załadować danych. Spróbuj odświeżyć stronę.',
        retry: 'Spróbuj ponownie',
        goHome: 'Strona główna',
        devDetails: 'Szczegóły błędu',
      },
      sidebar: {
        title: 'Gabinet pacjenta',
        dashboard: 'Panel',
        appointments: 'Moje wizyty',
        treatments: 'Leczenie',
        payments: 'Płatności',
        profile: 'Profil',
        soon: 'Wkrótce',
        navigation: 'Nawigacja gabinetu',
        openMenu: 'Otwórz menu',
        backToSite: 'Na stronę',
      },
      appointments: {
        cancelModal: {
          title: 'Anulować wizytę?',
          confirm: 'Tak, anuluj',
          back: 'Zachowaj wizytę',
          success: 'Wizyta anulowana',
          error: 'Nie udało się anulować wizyty',
        },
        reschedule: {
          title: 'Przesuń wizytę',
          button: 'Przesuń',
          current: 'Aktualna wizyta',
          selectTime: 'Wybierz nowy termin',
          noSlots: 'Brak dostępnych terminów',
          confirm: 'Potwierdź przesunięcie',
          success: 'Wizyta została przeniesiona',
          error: 'Nie udało się przenieść wizyty',
          at: 'o',
        },
      },
      treatments: {
        title: 'Leczenie',
        empty: 'Brak zapisów leczenia',
        doctor: 'Lekarz',
        diagnosis: 'Diagnoza',
        procedures: 'Procedury',
        teeth: 'Zęby',
        tooth: 'ząb',
        status: {
          draft: 'Szkic',
          signed: 'Podpisano',
          completed: 'Zakończono',
        },
        payment: {
          unpaid: 'Nieopłacono',
          partial: 'Częściowa płatność',
          paid: 'Opłacono',
          waived: 'Zwolniono',
          refunded: 'Zwrócono',
        },
      },
      payments: {
        title: 'Płatności',
        comingSoon: 'Wkrótce',
        description: 'Płatności online za usługi kliniczne są w trakcie realizacji.',
        feature1Title: 'Faktury',
        feature1Desc: 'Przeglądaj swoje faktury',
        feature2Title: 'Płatność',
        feature2Desc: 'Wygodna płatność online',
        feature3Title: 'Przypomnienia',
        feature3Desc: 'Powiadomienia o płatnościach',
        meanwhile: 'Obecnie płatności dokonuje się w klinice.',
      },
      profile: {
        personalInfo: 'Dane osobowe',
        contactInfo: 'Informacje kontaktowe',
        additionalInfo: 'Dodatkowe informacje',
        unsavedChanges: 'Masz niezapisane zmiany',
      },
    },
  },
}

for (const lang of ['uk', 'en', 'pl']) {
  const path = `src/locales/${lang}.json`
  const existing = JSON.parse(readFileSync(path, 'utf8'))
  const merged = deepMerge(existing, additions[lang])
  writeFileSync(path, JSON.stringify(merged, null, 2) + '\n')
  console.log(`Updated ${path}`)
}
console.log('Done')
