/**
 * Digitized clinic questionnaires — field definitions shared by the cabinet
 * form, the API validation and the admin print view.
 *
 * The structure mirrors the official paper анкети 1:1:
 *  - adult: "Анкета пацієнта — медична та стоматологічна історія"
 *  - child: "Анкета пацієнта — дитяча стоматологічна анкета"
 *
 * Answers are stored in patient_intake_forms.answers (JSONB) keyed by field id.
 * Yes/no items store 'yes' | 'no' | '' (unanswered); text items store strings.
 */

export type IntakeLocale = 'uk' | 'en' | 'pl'
export type IntakeLabel = Record<IntakeLocale, string>

export interface YesNoField {
  kind: 'yesno'
  id: string
  label: IntakeLabel
}

export interface TextField {
  kind: 'text'
  id: string
  label: IntakeLabel
  multiline?: boolean
  maxLength?: number
}

export interface ScaleField {
  kind: 'scale'
  id: string
  label: IntakeLabel
  min: number
  max: number
}

export type IntakeField = YesNoField | TextField | ScaleField

export interface IntakeSection {
  id: string
  title: IntakeLabel
  fields: IntakeField[]
}

const yn = (id: string, uk: string, en: string, pl: string): YesNoField => ({
  kind: 'yesno',
  id,
  label: { uk, en, pl },
})

const txt = (
  id: string,
  uk: string,
  en: string,
  pl: string,
  opts: { multiline?: boolean; maxLength?: number } = {}
): TextField => ({
  kind: 'text',
  id,
  label: { uk, en, pl },
  multiline: opts.multiline ?? false,
  maxLength: opts.maxLength ?? 300,
})

// ── Adult questionnaire ──────────────────────────────────────────────────────

export const ADULT_FORM: IntakeSection[] = [
  {
    id: 'diseases',
    title: {
      uk: 'Перенесені та супутні захворювання',
      en: 'Past and concurrent conditions',
      pl: 'Przebyte i współistniejące choroby',
    },
    fields: [
      yn('heart', 'Захворювання серця', 'Heart disease', 'Choroby serca'),
      yn(
        'vascular',
        'Судинні захворювання',
        'Vascular disease',
        'Choroby naczyniowe'
      ),
      yn('diabetes', 'Цукровий діабет', 'Diabetes', 'Cukrzyca'),
      yn(
        'blood',
        'Захворювання крові (кровотечі, незгортання)',
        'Blood disorders (bleeding, clotting)',
        'Choroby krwi (krwawienia, krzepnięcie)'
      ),
      yn(
        'anticoagulants',
        'Прийом ліків для згортання крові',
        'Blood clotting medication',
        'Leki wpływające na krzepnięcie krwi'
      ),
      yn(
        'infectious',
        'Інфекційні захворювання',
        'Infectious diseases',
        'Choroby zakaźne'
      ),
      yn('tuberculosis', 'Туберкульоз', 'Tuberculosis', 'Gruźlica'),
      yn(
        'oncology',
        'Онкологічні захворювання',
        'Oncological diseases',
        'Choroby onkologiczne'
      ),
      yn(
        'asthma',
        'Астма чи захворювання легенів',
        'Asthma or lung disease',
        'Astma lub choroby płuc'
      ),
      yn(
        'nervous',
        'Нервові захворювання',
        'Nervous system disorders',
        'Choroby układu nerwowego'
      ),
      yn('hepatitis', 'Гепатит', 'Hepatitis', 'Zapalenie wątroby'),
      yn('liver', 'Захворювання печінки', 'Liver disease', 'Choroby wątroby'),
      yn('rheumatism', 'Ревматизм', 'Rheumatism', 'Reumatyzm'),
      yn('kidneys', 'Захворювання нирок', 'Kidney disease', 'Choroby nerek'),
      yn('injuries', 'Травми', 'Injuries', 'Urazy'),
      yn('concussion', 'Струс мозку', 'Concussion', 'Wstrząśnienie mózgu'),
      yn('epilepsy', 'Епілепсія', 'Epilepsy', 'Padaczka'),
      yn('skin', 'Шкірні захворювання', 'Skin diseases', 'Choroby skóry'),
      yn(
        'hiv_tested',
        'Обстеження на ВІЛ/СНІД',
        'HIV/AIDS testing',
        'Badanie w kierunku HIV/AIDS'
      ),
      yn(
        'fungal',
        'Грибкові захворювання (були / є)',
        'Fungal infections (past / present)',
        'Choroby grzybicze (przebyte / obecne)'
      ),
      yn(
        'throat',
        'Біль у горлі / утруднене ковтання',
        'Sore throat / difficulty swallowing',
        'Ból gardła / trudności w połykaniu'
      ),
      yn(
        'lymph',
        'Збільшення лімфатичних вузлів',
        'Enlarged lymph nodes',
        'Powiększone węzły chłonne'
      ),
      yn(
        'rashes',
        'Періодичні висипання на шкірі',
        'Recurring skin rashes',
        'Nawracające wysypki skórne'
      ),
      yn(
        'gastro',
        'Шлунково-кишкові захворювання',
        'Gastrointestinal diseases',
        'Choroby żołądkowo-jelitowe'
      ),
      yn(
        'venereal',
        'Венеричні захворювання',
        'Venereal diseases',
        'Choroby weneryczne'
      ),
      yn('smoking', 'Ви палите?', 'Do you smoke?', 'Czy palisz?'),
      txt(
        'diseases_note',
        'Уточнення / інше',
        'Clarification / other',
        'Doprecyzowanie / inne',
        { multiline: true, maxLength: 500 }
      ),
    ],
  },
  {
    id: 'allergies',
    title: {
      uk: 'Алергічні реакції',
      en: 'Allergic reactions',
      pl: 'Reakcje alergiczne',
    },
    fields: [
      txt(
        'allergy_anesthetics',
        'Місцеві анестетики',
        'Local anesthetics',
        'Znieczulenia miejscowe'
      ),
      txt('allergy_antibiotics', 'Антибіотики', 'Antibiotics', 'Antybiotyki'),
      txt(
        'allergy_latex',
        'Латекс (рукавички, кофердам)',
        'Latex (gloves, rubber dam)',
        'Lateks (rękawiczki, koferdam)'
      ),
      txt(
        'allergy_metals',
        'Метали (нікель, сплави)',
        'Metals (nickel, alloys)',
        'Metale (nikiel, stopy)'
      ),
      txt('allergy_antiseptics', 'Антисептики', 'Antiseptics', 'Antyseptyki'),
      txt('allergy_pollen', 'Пилок рослин', 'Plant pollen', 'Pyłki roślin'),
      txt(
        'allergy_food',
        'Харчові продукти / інші',
        'Food / other',
        'Produkty spożywcze / inne'
      ),
      txt(
        'regular_medication',
        'Постійно / періодично приймаю',
        'Regular / periodic medication',
        'Przyjmowane stale / okresowo leki',
        { multiline: true, maxLength: 500 }
      ),
    ],
  },
  {
    id: 'women',
    title: { uk: 'Для жінок', en: 'For women', pl: 'Dla kobiet' },
    fields: [
      yn(
        'contraceptives',
        'Приймаєте оральні контрацептиви',
        'Taking oral contraceptives',
        'Przyjmowanie doustnych środków antykoncepcyjnych'
      ),
      yn('pregnancy', 'Вагітність', 'Pregnancy', 'Ciąża'),
      yn(
        'breastfeeding',
        'Годування грудьми',
        'Breastfeeding',
        'Karmienie piersią'
      ),
    ],
  },
  {
    id: 'additional',
    title: {
      uk: 'Додаткові відомості',
      en: 'Additional information',
      pl: 'Informacje dodatkowe',
    },
    fields: [
      txt(
        'surgeries',
        'Перенесені операції / травми',
        'Past surgeries / injuries',
        'Przebyte operacje / urazy',
        { multiline: true, maxLength: 500 }
      ),
      txt(
        'hereditary',
        'Спадкові захворювання',
        'Hereditary diseases',
        'Choroby dziedziczne',
        { multiline: true, maxLength: 500 }
      ),
      txt(
        'anesthesia_reactions',
        'Реакції на анестезію в минулому',
        'Past reactions to anesthesia',
        'Reakcje na znieczulenie w przeszłości',
        { multiline: true, maxLength: 500 }
      ),
      txt(
        'treatment_wishes',
        'Особливі побажання щодо лікування',
        'Special treatment wishes',
        'Szczególne życzenia dotyczące leczenia',
        { multiline: true, maxLength: 500 }
      ),
    ],
  },
  {
    id: 'dental',
    title: {
      uk: 'Стоматологічний анамнез',
      en: 'Dental history',
      pl: 'Wywiad stomatologiczny',
    },
    fields: [
      yn(
        'tmj',
        'Біль або хруст у скронево-нижньощелепному суглобі',
        'Pain or clicking in the temporomandibular joint',
        'Ból lub trzaski w stawie skroniowo-żuchwowym'
      ),
      yn(
        'bleeding_gums',
        'Кровоточивість ясен при чищенні зубів',
        'Bleeding gums when brushing',
        'Krwawienie dziąseł podczas szczotkowania'
      ),
      yn(
        'lip_cracks',
        'Поява тріщин губ, заїдів у кутиках рота',
        'Lip cracks, sores in mouth corners',
        'Pęknięcia warg, zajady w kącikach ust'
      ),
      yn(
        'bruxism',
        'Бруксизм (нічне скреготіння зубами)',
        'Bruxism (night teeth grinding)',
        'Bruksizm (nocne zgrzytanie zębami)'
      ),
      yn(
        'aesthetics',
        'Бажаєте змінити естетичний вигляд зубів (колір, форма, прикус)',
        'Wish to improve dental aesthetics (color, shape, bite)',
        'Chęć zmiany estetyki zębów (kolor, kształt, zgryz)'
      ),
    ],
  },
]

// ── Children's questionnaire ─────────────────────────────────────────────────

export const CHILD_FORM: IntakeSection[] = [
  {
    id: 'representative',
    title: {
      uk: 'Дані дитини та законного представника',
      en: 'Child and legal representative details',
      pl: 'Dane dziecka i przedstawiciela ustawowego',
    },
    fields: [
      txt(
        'child_school',
        'Навчальний заклад',
        'Educational institution',
        'Placówka edukacyjna'
      ),
      txt(
        'representative_name',
        'П.І.Б. законного представника',
        'Legal representative full name',
        'Imię i nazwisko przedstawiciela ustawowego'
      ),
      txt(
        'representative_relation',
        'Ким доводиться дитині',
        'Relation to the child',
        'Stopień pokrewieństwa z dzieckiem',
        { maxLength: 100 }
      ),
    ],
  },
  {
    id: 'general',
    title: {
      uk: 'Загальний стан',
      en: 'General condition',
      pl: 'Stan ogólny',
    },
    fields: [
      yn(
        'under_supervision',
        'Дитина перебуває під наглядом лікаря',
        'The child is under medical supervision',
        'Dziecko jest pod opieką lekarza'
      ),
      txt(
        'supervision_specialist',
        'Під наглядом якого фахівця',
        'Supervising specialist',
        'Lekarz prowadzący'
      ),
      yn(
        'serious_illnesses',
        'Перенесені серйозні хвороби чи операції',
        'Past serious illnesses or surgeries',
        'Przebyte poważne choroby lub operacje'
      ),
      txt(
        'illnesses_detail',
        'Які саме хвороби / операції',
        'Which illnesses / surgeries',
        'Jakie choroby / operacje',
        { multiline: true, maxLength: 500 }
      ),
    ],
  },
  {
    id: 'diseases',
    title: {
      uk: 'Перенесені та супутні захворювання',
      en: 'Past and concurrent conditions',
      pl: 'Przebyte i współistniejące choroby',
    },
    fields: [
      yn(
        'rheumatism',
        'Ревматизм / ревмокардит',
        'Rheumatism / rheumatic heart disease',
        'Reumatyzm / choroba reumatyczna serca'
      ),
      yn(
        'heart_defects',
        'Вроджені вади серця',
        'Congenital heart defects',
        'Wrodzone wady serca'
      ),
      yn(
        'asthma',
        'Астма чи захворювання легенів',
        'Asthma or lung disease',
        'Astma lub choroby płuc'
      ),
      yn(
        'allergy',
        'Прояви алергії (медикаменти, харчові, побутова хімія)',
        'Allergies (medication, food, household chemicals)',
        'Alergie (leki, pokarmy, chemia domowa)'
      ),
      yn('diabetes', 'Діабет', 'Diabetes', 'Cukrzyca'),
      yn(
        'hepatitis',
        'Гепатит, жовтяниця або хвороби печінки',
        'Hepatitis, jaundice or liver disease',
        'Zapalenie wątroby, żółtaczka lub choroby wątroby'
      ),
      yn('tuberculosis', 'Туберкульоз', 'Tuberculosis', 'Gruźlica'),
      yn(
        'venereal',
        'Венеричні хвороби',
        'Venereal diseases',
        'Choroby weneryczne'
      ),
      yn('hiv', 'ВІЛ / СНІД', 'HIV / AIDS', 'HIV / AIDS'),
      yn(
        'seizures',
        'Втрата свідомості (епілептичні напади)',
        'Loss of consciousness (epileptic seizures)',
        'Utrata przytomności (napady padaczkowe)'
      ),
      yn(
        'thyroid',
        'Захворювання щитоподібної залози',
        'Thyroid disease',
        'Choroby tarczycy'
      ),
      yn(
        'kidneys',
        'Порушення функції нирок',
        'Kidney dysfunction',
        'Zaburzenia czynności nerek'
      ),
      yn(
        'bruising',
        'Легко утворюються синці',
        'Bruises easily',
        'Łatwe powstawanie siniaków'
      ),
      yn(
        'nosebleeds',
        'Часті носові кровотечі',
        'Frequent nosebleeds',
        'Częste krwawienia z nosa'
      ),
      txt(
        'allergy_detail',
        'Якщо є алергія — вкажіть, на що',
        'If allergic — specify to what',
        'Jeśli występuje alergia — na co',
        { multiline: true, maxLength: 500 }
      ),
    ],
  },
  {
    id: 'additional',
    title: {
      uk: 'Додаткові відомості про дитину',
      en: 'Additional information about the child',
      pl: 'Dodatkowe informacje o dziecku',
    },
    fields: [
      txt(
        'other_conditions',
        'Інші проблеми чи стани, про які слід повідомити лікаря',
        'Other issues the doctor should know about',
        'Inne problemy, o których lekarz powinien wiedzieć',
        { multiline: true, maxLength: 500 }
      ),
      txt(
        'medications',
        'Медикаменти, які приймає дитина (у т.ч. вітаміни)',
        'Medication the child takes (incl. vitamins)',
        'Leki przyjmowane przez dziecko (w tym witaminy)',
        { multiline: true, maxLength: 500 }
      ),
      txt(
        'pregnancy_illnesses',
        'Захворювання або токсикози під час вагітності',
        'Illnesses or toxicosis during pregnancy',
        'Choroby lub zatrucia w czasie ciąży',
        { multiline: true, maxLength: 500 }
      ),
      txt(
        'pregnancy_medications',
        'Прийом медикаментів під час вагітності',
        'Medication taken during pregnancy',
        'Leki przyjmowane w czasie ciąży',
        { multiline: true, maxLength: 500 }
      ),
      txt(
        'breastfeeding_notes',
        'Особливості грудного вигодовування (тривалість, пригодовування та догодовування)',
        'Breastfeeding details (duration, supplementation)',
        'Karmienie piersią (czas trwania, dokarmianie)',
        { multiline: true, maxLength: 500 }
      ),
      txt(
        'teething',
        'Терміни прорізування тимчасових зубів (норма / раннє / пізнє)',
        'Primary teeth eruption timing (normal / early / late)',
        'Ząbkowanie zębów mlecznych (norma / wczesne / późne)',
        { maxLength: 200 }
      ),
    ],
  },
  {
    id: 'dental',
    title: {
      uk: 'Стоматологічний анамнез',
      en: 'Dental history',
      pl: 'Wywiad stomatologiczny',
    },
    fields: [
      yn(
        'habits',
        'Шкідливі звички (пустушка, смоктання пальця, гризіння нігтів)',
        'Habits (pacifier, thumb sucking, nail biting)',
        'Nawyki (smoczek, ssanie kciuka, obgryzanie paznokci)'
      ),
      yn(
        'bleeding_gums',
        'Кровоточивість ясен при чищенні зубів',
        'Bleeding gums when brushing',
        'Krwawienie dziąseł podczas szczotkowania'
      ),
      yn(
        'bruxism',
        'Нічне скреготіння зубами (бруксизм)',
        'Night teeth grinding (bruxism)',
        'Nocne zgrzytanie zębami (bruksizm)'
      ),
      yn(
        'previous_treatment_problems',
        'Проблеми з попереднім стоматологічним лікуванням',
        'Problems with previous dental treatment',
        'Problemy z wcześniejszym leczeniem stomatologicznym'
      ),
      {
        kind: 'scale',
        id: 'fear_level',
        label: {
          uk: 'Страх перед лікуванням (0 — немає, 10 — паніка)',
          en: 'Fear of treatment (0 — none, 10 — panic)',
          pl: 'Strach przed leczeniem (0 — brak, 10 — panika)',
        },
        min: 0,
        max: 10,
      },
      txt(
        'dental_note',
        'Уточнення / інше',
        'Clarification / other',
        'Doprecyzowanie / inne',
        { multiline: true, maxLength: 500 }
      ),
    ],
  },
]

export const INTAKE_FORMS: Record<'adult' | 'child', IntakeSection[]> = {
  adult: ADULT_FORM,
  child: CHILD_FORM,
}

/** Flat list of the field definitions of a form (for validation/rendering). */
export function intakeFormFields(formType: 'adult' | 'child'): IntakeField[] {
  return INTAKE_FORMS[formType].flatMap(section => section.fields)
}
