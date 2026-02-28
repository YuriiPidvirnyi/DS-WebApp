import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Phone, CheckCircle2, Star } from 'lucide-react'
import { SITE_INFO } from '@/utils/constants'

const benefits = [
  'Безкоштовна консультація',
  'Сучасне обладнання',
  'Досвідчені лікарі',
]

export default function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 lg:space-y-8 order-2 lg:order-1 animate-fade-in">
            {/* Rating badge */}
            <div className="inline-flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full shadow-sm">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">{SITE_INFO.rating}</span>
              <span className="text-sm text-muted-foreground">({SITE_INFO.reviewCount} відгуків)</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-foreground leading-[1.1]" suppressHydrationWarning>
                Сучасна стоматологія{' '}
                <span className="text-primary">у центрі Львова</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed" suppressHydrationWarning>
                Ваша історія красивої та здорової посмішки починається тут. 
                Професійна команда, передові технології, індивідуальний підхід.
              </p>
            </div>

            {/* Benefits */}
            <ul className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-x-6">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Link
                href="/booking"
                className="btn-primary text-base px-6 sm:px-8 py-3.5 sm:py-4 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
              >
                <Phone className="h-5 w-5" />
                <span>Записатися на прийом</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/services"
                className="btn-secondary text-base px-6 sm:px-8 py-3.5 sm:py-4"
              >
                Наші послуги
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-10 pt-6 border-t border-border">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">5000+</p>
                <p className="text-sm text-muted-foreground">Задоволених пацієнтів</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">10+</p>
                <p className="text-sm text-muted-foreground">Років досвіду</p>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">98%</p>
                <p className="text-sm text-muted-foreground">Рекомендують нас</p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative order-1 lg:order-2 animate-fade-in animation-delay-200">
            <div className="relative aspect-[4/3] lg:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/hero-dental.jpg"
                alt="Dental Story - сучасна стоматологічна клініка у Львові"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent" />
            </div>

            {/* Floating card */}
            <div className="absolute -bottom-4 -left-4 sm:bottom-6 sm:-left-6 bg-card rounded-xl sm:rounded-2xl p-4 shadow-xl border border-border max-w-[200px] sm:max-w-[240px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm sm:text-base">Безкоштовно</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Перша консультація</p>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-2xl -z-10" aria-hidden="true" />
            <div className="absolute -bottom-4 right-1/4 w-16 h-16 sm:w-20 sm:h-20 bg-primary/5 rounded-xl -z-10" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  )
}
