import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Dental Story — Сучасна стоматологія у Львові'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #AECED3 0%, #8BB5BB 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.92)',
            borderRadius: '24px',
            padding: '64px 80px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            gap: '16px',
          }}
        >
          {/* Tooth icon placeholder */}
          <div
            style={{
              fontSize: '72px',
              lineHeight: 1,
            }}
          >
            🦷
          </div>

          {/* Clinic name */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: '#1A3A3E',
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            Dental Story
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '32px',
              color: '#4A7A82',
              fontWeight: 400,
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            Сучасна стоматологія у Львові
          </div>

          {/* Divider */}
          <div
            style={{
              width: '80px',
              height: '4px',
              background: '#AECED3',
              borderRadius: '2px',
              margin: '8px 0',
            }}
          />

          {/* URL */}
          <div
            style={{
              fontSize: '24px',
              color: '#8BB5BB',
              fontWeight: 500,
            }}
          >
            dentalstory.com.ua
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
