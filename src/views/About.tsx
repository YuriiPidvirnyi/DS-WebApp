'use client'

import { useEffect, useState } from 'react'
import { Award, Users, Clock, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import images from '@/content/images.json'
import { getDoctors, type Doctor } from '@/services/doctors'
import { experienceLabel } from '@/utils/experienceLabel'
import AnimatedCard from '@/components/ui/AnimatedCard'
import LazyImage from '@/components/ui/LazyImage'
import { Card, CardMedia } from '@/components/ui'

const About = () => {
  const { t, i18n } = useTranslation()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorsLoading, setDoctorsLoading] = useState(true)

  useEffect(() => {
    getDoctors()
      .then(res => {
        if (res.success && Array.isArray(res.data)) setDoctors(res.data)
      })
      .catch(() => {})
      .finally(() => setDoctorsLoading(false))
  }, [])

  const stats = [
    { number: '10+', labelKey: 'about.stats.experience' },
    { number: '5000+', labelKey: 'about.stats.patients' },
    { number: '15+', labelKey: 'about.stats.specialists' },
    { number: '98%', labelKey: 'about.stats.positiveReviews' },
  ]

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
  // Keyed by images.json team[].title and looked up by doctor.fullName below.
  // Today NOTHING matches by design: the DB still carries seeded demo names,
  // so every card falls through to doctor.photo / fallbackPhoto. The roster-
  // rename migration (blocked on the owner supplying real full names) will
  // align the two and add a coupling test — until then this map is dormant.
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

  const fallbackPhoto = '/assets/images/gallery/dental-team.jpg'

  return (
    <div className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-dental-dark mb-6">
            {t('about.title')}
          </h1>
          <p className="text-xl text-dental-text max-w-3xl mx-auto">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-20">
          {stats.map((stat, index) => (
            <Card
              key={index}
              variant="ghost"
              padding="md"
              className="text-center"
            >
              <div className="text-4xl lg:text-5xl font-bold text-dental-dark mb-2">
                {stat.number}
              </div>
              <div className="text-dental-text font-medium">
                {t(stat.labelKey)}
              </div>
            </Card>
          ))}
        </div>

        {/* Our Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-dental-dark">
              {t('about.story.title')}
            </h2>
            <p className="text-dental-text leading-relaxed">
              {t('about.story.paragraph1')}
            </p>
            <p className="text-dental-text leading-relaxed">
              {t('about.story.paragraph2')}
            </p>
          </div>
          <Card variant="elevated" padding="none" className="overflow-hidden">
            <CardMedia aspectRatio="wide" className="relative">
              <LazyImage
                src="/assets/images/clinic/waiting-room.jpg"
                alt={t('about.story.photoAlt')}
                // Just below the text hero — often in the initial viewport and a
                // likely LCP candidate, so load eagerly (maps to next/image priority).
                loading="eager"
                // The file's real dimensions (1280×876) — passed so next/image
                // builds its srcset off the true canvas, not the 800×600
                // default. object-cover absorbs the small gap to the 3:2 box.
                width={1280}
                height={876}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </CardMedia>
            <div className="p-6 text-center">
              <h3 className="text-2xl font-semibold text-dental-dark mb-1">
                {t('common.brandName')}
              </h3>
              <p className="text-dental-text">{t('about.story.mission')}</p>
            </div>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dental-dark mb-4">
              {t('about.values.title')}
            </h2>
            <p className="text-dental-text max-w-2xl mx-auto">
              {t('about.values.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <AnimatedCard
                key={index}
                variant="default"
                hoverEffect="lift"
                delay={index * 100}
                className="text-center p-6"
              >
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-dental-dark mb-3">
                  {t(value.titleKey)}
                </h3>
                <p className="text-dental-text">{t(value.descriptionKey)}</p>
              </AnimatedCard>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dental-dark mb-4">
              {t('about.team.title')}
            </h2>
            <p className="text-dental-text max-w-2xl mx-auto">
              {t('about.team.subtitle')}
            </p>
          </div>

          {doctorsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <Card
                  key={i}
                  variant="elevated"
                  padding="lg"
                  className="text-center animate-pulse"
                >
                  <div className="w-24 h-24 rounded-full mx-auto mb-6 bg-dental-secondary-200" />
                  <div className="h-5 bg-dental-secondary-100 rounded mx-auto w-40 mb-3" />
                  <div className="h-4 bg-dental-secondary-100 rounded mx-auto w-32 mb-2" />
                  <div className="h-3 bg-dental-secondary-100 rounded mx-auto w-24" />
                </Card>
              ))}
            </div>
          ) : doctors.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {doctors.map((doctor, index) => {
                const photo = teamPhotos[doctor.fullName]
                const photoSrc =
                  doctor.photo || photo?.src || photo?.fallback || fallbackPhoto
                return (
                  <AnimatedCard
                    key={doctor.id}
                    variant="elevated"
                    hoverEffect="lift"
                    delay={index * 100}
                    className="p-8 text-center"
                  >
                    <div className="w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden bg-dental-primary-100">
                      {/* eslint-disable-next-line @next/next/no-img-element -- onError fallback requires native img */}
                      <img
                        src={photoSrc}
                        onError={e => {
                          const img = e.currentTarget as HTMLImageElement
                          if (
                            img.src !==
                            window.location.origin + fallbackPhoto
                          )
                            img.src = fallbackPhoto
                        }}
                        alt={photo?.alt || doctor.fullName}
                        className="w-full h-full object-cover"
                        width={96}
                        height={96}
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-dental-dark mb-2">
                      {doctor.fullName}
                    </h3>
                    <p className="text-dental-primary-600 font-medium mb-2">
                      {doctor.specialization}
                    </p>
                    <p className="text-dental-text text-sm mb-3">
                      {experienceLabel(t, i18n.language, doctor.experience)}
                    </p>
                    {doctor.education && (
                      <p className="text-dental-muted text-sm">
                        {doctor.education}
                      </p>
                    )}
                  </AnimatedCard>
                )
              })}
            </div>
          ) : null}
        </div>

        {/* Equipment */}
        <Card variant="brand" padding="xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-dental-dark mb-6">
                {t('about.equipment.title')}
              </h2>
              <div className="space-y-4">
                {[
                  'about.equipment.items.xray.name',
                  'about.equipment.items.tomography.name',
                  'about.equipment.items.laser.name',
                  'about.equipment.items.cadcam.name',
                  'about.equipment.items.ultrasonic.name',
                ].map(key => (
                  <div key={key} className="flex items-center">
                    <div className="w-2 h-2 bg-dental-teal rounded-full mr-3 shrink-0"></div>
                    <span className="text-dental-text">{t(key)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.equipment?.slice(0, 4).map((eq, idx) => (
                <CardMedia key={idx} aspectRatio="wide" className="bg-white">
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
                    alt={eq.alt || eq.title || t('about.equipment.defaultAlt')}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </CardMedia>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default About
