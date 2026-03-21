'use client'

import { Award, Users, Clock, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import images from '@/content/images.json'

const About = () => {
  const { t } = useTranslation()

  const stats = [
    { number: '10+', labelKey: 'about.stats.experience' },
    { number: '5000+', labelKey: 'about.stats.patients' },
    { number: '15+', labelKey: 'about.stats.specialists' },
    { number: '98%', labelKey: 'about.stats.positiveReviews' },
  ]

  const team = [
    {
      nameKey: 'about.team.members.member1.name',
      positionKey: 'about.team.members.member1.position',
      experienceKey: 'about.team.members.member1.experience',
      educationKey: 'about.team.members.member1.education',
    },
    {
      nameKey: 'about.team.members.member2.name',
      positionKey: 'about.team.members.member2.position',
      experienceKey: 'about.team.members.member2.experience',
      educationKey: 'about.team.members.member2.education',
    },
    {
      nameKey: 'about.team.members.member3.name',
      positionKey: 'about.team.members.member3.position',
      experienceKey: 'about.team.members.member3.experience',
      educationKey: 'about.team.members.member3.education',
    },
  ]

  // Map photos from images.json to team members by name
  type TeamPhoto = {
    title: string
    src?: string
    fallback?: string
    alt?: string
  }
  type EquipmentPhoto = {
    src?: string
    fallback?: string
    alt?: string
    title?: string
  }
  const data = images as unknown as {
    team?: TeamPhoto[]
    equipment?: EquipmentPhoto[]
  }
  const teamPhotos: Record<
    string,
    { src?: string; fallback?: string; alt?: string }
  > = {}
  data.team?.forEach(p => {
    teamPhotos[p.title] = { src: p.src, fallback: p.fallback, alt: p.alt }
  })

  const values = [
    {
      icon: <Heart className="h-8 w-8 text-dental-teal" />,
      titleKey: 'about.values.care.title',
      descriptionKey: 'about.values.care.description',
    },
    {
      icon: <Award className="h-8 w-8 text-dental-teal" />,
      titleKey: 'about.values.professionalism.title',
      descriptionKey: 'about.values.professionalism.description',
    },
    {
      icon: <Users className="h-8 w-8 text-dental-teal" />,
      titleKey: 'about.values.teamwork.title',
      descriptionKey: 'about.values.teamwork.description',
    },
    {
      icon: <Clock className="h-8 w-8 text-dental-teal" />,
      titleKey: 'about.values.punctuality.title',
      descriptionKey: 'about.values.punctuality.description',
    },
  ]

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {t('about.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-slate-800 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>

        {/* Our Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">
              {t('about.story.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {t('about.story.paragraph1')}
            </p>
            <p className="text-gray-600 leading-relaxed">
              {t('about.story.paragraph2')}
            </p>
          </div>
          <div className="bg-gradient-to-br from-dental-blue/10 to-dental-teal/10 rounded-2xl p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🦷</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {t('common.brandName')}
              </h3>
              <p className="text-gray-600">{t('about.story.mission')}</p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('about.values.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('about.values.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {t(value.titleKey)}
                </h3>
                <p className="text-gray-600">{t(value.descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('about.team.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('about.team.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {team.map((doctor, index) => {
              const doctorName = t(doctor.nameKey)
              const photo = teamPhotos[doctorName]
              const fallback =
                photo?.fallback || '/assets/images/gallery/dental-team.jpg'
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow"
                >
                  <div className="w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden bg-dental-blue/20">
                    {/* eslint-disable-next-line @next/next/no-img-element -- onError fallback requires native img */}
                    <img
                      src={photo?.src || fallback}
                      onError={e => {
                        const img = e.currentTarget as HTMLImageElement
                        if (img.src !== window.location.origin + fallback)
                          img.src = fallback
                      }}
                      alt={photo?.alt || doctorName}
                      className="w-full h-full object-cover"
                      width={96}
                      height={96}
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {doctorName}
                  </h3>
                  <p className="text-teal-800 font-medium mb-2">
                    {t(doctor.positionKey)}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">
                    {t(doctor.experienceKey)}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {t(doctor.educationKey)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-gray-50 rounded-2xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('about.equipment.title')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-dental-teal rounded-full mr-3"></div>
                  <span className="text-gray-700">
                    {t('about.equipment.items.xray.name')}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-dental-teal rounded-full mr-3"></div>
                  <span className="text-gray-700">
                    {t('about.equipment.items.tomography.name')}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-dental-teal rounded-full mr-3"></div>
                  <span className="text-gray-700">
                    {t('about.equipment.items.laser.name')}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-dental-teal rounded-full mr-3"></div>
                  <span className="text-gray-700">
                    {t('about.equipment.items.cadcam.name')}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-dental-teal rounded-full mr-3"></div>
                  <span className="text-gray-700">
                    {t('about.equipment.items.ultrasonic.name')}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl">
              <div className="grid grid-cols-2 gap-4">
                {data.equipment?.slice(0, 4).map((eq, idx) => (
                  <div
                    key={idx}
                    className="aspect-[3/2] overflow-hidden rounded-xl bg-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- onError fallback requires native img */}
                    <img
                      src={
                        eq.src || '/assets/images/gallery/dental-equipment.jpg'
                      }
                      onError={e => {
                        const img = e.currentTarget as HTMLImageElement
                        if (!img.dataset.fallback) {
                          img.dataset.fallback = '1'
                          img.src =
                            eq.fallback ||
                            '/assets/images/gallery/dental-equipment.jpg'
                        }
                      }}
                      alt={
                        eq.alt || eq.title || t('about.equipment.defaultAlt')
                      }
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
