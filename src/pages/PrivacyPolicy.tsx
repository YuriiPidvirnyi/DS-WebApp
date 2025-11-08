import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'
import { Helmet } from 'react-helmet-async'

const PrivacyPolicy = () => {
  return (
    <div className="py-16">
      <Helmet>
        <title>Політика конфіденційності — Dental Story</title>
        <meta
          name="description"
          content="Як ми збираємо, зберігаємо та обробляємо ваші персональні дані. Конфіденційність пацієнтів — наш пріоритет."
        />
        <link
          rel="canonical"
          href="https://dentalstory.com.ua/privacy-policy"
        />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-dental-teal hover:text-teal-600 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Повернутися на головну
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Політика конфіденційності
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
              Стоматологічна клініка "Dental Story" (далі - "Клініка", "ми")
              поважає вашу конфіденційність та зобов'язується захищати
              персональні дані, які ви надаєте нам. Ця Політика конфіденційності
              пояснює, як ми збираємо, використовуємо та захищаємо вашу
              інформацію.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Використовуючи наш веб-сайт або послуги, ви погоджуєтеся з умовами
              цієї Політики конфіденційності.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Персональні дані, які ми збираємо
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ми можемо збирати наступні типи персональних даних:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Ім'я та прізвище</li>
              <li>Номер телефону</li>
              <li>Адреса електронної пошти</li>
              <li>
                Медична історія та інформація про стан здоров'я ротової
                порожнини
              </li>
              <li>Дата народження</li>
              <li>Адреса проживання (якщо необхідно)</li>
              <li>Інформація про попереднє лікування</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Мета використання персональних даних
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ваші персональні дані використовуються для:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Надання медичних послуг та лікування</li>
              <li>Ведення медичної документації</li>
              <li>Зв'язку з пацієнтами щодо прийомів</li>
              <li>Інформування про послуги та акції</li>
              <li>Покращення якості наших послуг</li>
              <li>Виконання законних вимог</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Захист персональних даних
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ми вживаємо відповідних технічних та організаційних заходів для
              захисту ваших персональних даних від несанкціонованого доступу,
              втрати, знищення або розкриття:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Обмежений доступ до персональних даних лише уповноваженому
                персоналу
              </li>
              <li>Використання сучасних методів шифрування</li>
              <li>Регулярне оновлення систем безпеки</li>
              <li>Зберігання даних у захищених системах</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Передача персональних даних третім особам
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Ми не продаємо, не обмінюємо та не передаємо ваші персональні дані
              третім особам, за винятком випадків, передбачених законом України,
              або за вашою згодою. Можлива передача даних медичним лабораторіям
              або страховим компаніям у рамках надання медичних послуг.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Ваші права
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Згідно з законодавством України, ви маєте право:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                Отримувати інформацію про обробку ваших персональних даних
              </li>
              <li>Доступ до ваших персональних даних</li>
              <li>Вимагати виправлення неточних даних</li>
              <li>Вимагати видалення ваших персональних даних</li>
              <li>Обмеження обробки ваших даних</li>
              <li>Подавати скарги до органів захисту персональних даних</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Файли cookie
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Наш веб-сайт може використовувати файли cookie для покращення
              користувацького досвіду. Ви можете налаштувати свій браузер для
              відмови від cookie, але це може вплинути на функціональність
              сайту.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Зберігання персональних даних
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Ми зберігаємо ваші персональні дані тільки стільки, скільки
              необхідно для досягнення мети їх обробки або відповідно до вимог
              законодавства. Медичні дані зберігаються згідно з вимогами
              медичного законодавства України.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Зміни до Політики конфіденційності
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Ми залишаємо за собою право оновлювати цю Політику
              конфіденційності. Про будь-які зміни ми повідомимо на нашому
              веб-сайті. Дата останньої редакції вказана на початку документа.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Контактна інформація
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Якщо у вас є питання щодо цієї Політики конфіденційності або
              обробки ваших персональних даних, зв'яжіться з нами:
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
              <p className="text-gray-700">
                Email: {CONTACT_INFO.privacyEmail}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
