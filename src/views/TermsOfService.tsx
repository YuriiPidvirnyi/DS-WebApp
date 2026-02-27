'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'

const TermsOfService = () => {
  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-dental-teal hover:text-teal-600 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Повернутися на головну
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Умови використання
          </h1>
          <p className="text-gray-600">Остання редакція: 17 жовтня 2024 року</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Загальні положення
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ці Умови використання (далі - "Умови") регулюють використання
              веб-сайту та послуг стоматологічної клініки "Dental Story" (далі -
              "Клініка", "ми"). Використовуючи наш веб-сайт або послуги, ви
              погоджуєтеся дотримуватися цих умов.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Якщо ви не погоджуєтеся з будь-якою частиною цих умов, будь ласка,
              не використовуйте наш веб-сайт або послуги.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Використання веб-сайту
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ви маєте право використовувати наш веб-сайт для:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Отримання інформації про наші послуги</li>
              <li>Запису на прийом до лікаря</li>
              <li>Зв'язку з клінікою</li>
              <li>Перегляду галереї робіт</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Ви зобов'язуєтесь не використовувати веб-сайт для незаконних цілей
              або способами, що можуть пошкодити роботу сайту або репутації
              клініки.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Запис на прийом та скасування
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Запис на прийом:
                </h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>
                    Запис здійснюється через веб-сайт, телефон або особисто
                  </li>
                  <li>Підтвердження запису надходить протягом 30 хвилин</li>
                  <li>При записі необхідно надавати достовірну інформацію</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Скасування:
                </h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Скасування можливе за 24 години до візиту</li>
                  <li>
                    При скасуванні менше ніж за 24 години може стягуватися штраф
                  </li>
                  <li>При неявці без попередження — 50% вартості послуги</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Медичні послуги та відповідальність
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Наша клініка надає медичні послуги згідно з чинним законодавством
              України:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Всі лікарі мають відповідні ліцензії та кваліфікацію</li>
              <li>Лікування проводиться згідно з медичними стандартами</li>
              <li>Пацієнт має право на повну інформацію про лікування</li>
              <li>Згода на лікування оформлюється письмово</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Результат лікування може варіюватися залежно від індивідуальних
              особливостей організму пацієнта. Клініка не несе відповідальність
              за результати, що не відповідають очікуванням пацієнта, якщо
              лікування проводилося згідно з медичними стандартами.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Оплата послуг
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Оплата послуг здійснюється згідно з прейскурантом клініки:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Консультація лікаря оплачується перед прийомом</li>
                <li>
                  Лікування оплачується перед початком або після завершення
                </li>
                <li>Приймаються готівкові та безготівкові платежі</li>
                <li>
                  При відмові від лікування кошти за консультацію не
                  повертаються
                </li>
                <li>
                  Повернення коштів за недоотримані послуги здійснюється
                  протягом 14 днів
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Гарантії та рекламації
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Клініка надає гарантії на виконані роботи згідно з медичними
              стандартами:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Пломби: 12 місяців</li>
              <li>Коронки та мости: 24 місяці</li>
              <li>Імплантати: 60 місяців</li>
              <li>Брекет-системи: на весь період лікування</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Гарантія не поширюється на випадки недотримання пацієнтом
              рекомендацій лікаря, механічних пошкоджень або природного зносу.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Конфіденційність та персональні дані
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Обробка персональних даних здійснюється згідно з нашою
              <Link
                href="/privacy-policy"
                className="text-dental-teal hover:underline"
              >
                Політикою конфіденційності
              </Link>
              .
            </p>
            <p className="text-gray-700 leading-relaxed">
              Медична інформація про пацієнтів є конфіденційною та захищається
              згідно з вимогами медичного законодавства України.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Інтелектуальна власність
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Всі матеріали на цьому веб-сайті, включаючи текст, зображення,
              логотипи та дизайн, є власністю клініки "Dental Story" або
              використовуються з дозволу правовласників. Копіювання або
              використання без письмового дозволу заборонено.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Обмеження відповідальності
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Клініка не несе відповідальність за:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Тимчасову недоступність веб-сайту</li>
              <li>Технічні збої в роботі онлайн-сервісів</li>
              <li>Дії третіх осіб, що використовують наш веб-сайт</li>
              <li>Непрямі збитки, пов'язані з використанням наших послуг</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Зміни до умов використання
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Ми залишаємо за собою право оновлювати ці Умови використання в
              будь-який час. Про суттєві зміни ми повідомляємо на веб-сайті або
              через електронну пошту. Продовжене використання наших послуг після
              оновлення умов означає вашу згоду з новими умовами.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Вирішення спорів
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Будь-які спори вирішуються шляхом переговорів. У разі неможливості
              досягти згоди, спори вирішуються в судовому порядку згідно з
              законодавством України. Юрисдикція: суди міста Києва.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Контактна інформація
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              З питань щодо цих Умов використання звертайтеся до нас:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>Стоматологічна клініка "{SITE_INFO.name}"</strong>
              </p>
              <p className="text-gray-700 mb-2">
                Адреса: {CONTACT_INFO.address.fullWithPostal}
              </p>
              <p className="text-gray-700 mb-2">
                Телефон: {CONTACT_INFO.phone}
              </p>
              <p className="text-gray-700">Email: {CONTACT_INFO.email}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService
