#!/usr/bin/env node
/**
 * Generate sitemap.xml for Dental Story website
 * Run: node scripts/generate-sitemap.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.dentalstory.com.ua'
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml')

// Static pages configuration
const STATIC_PAGES = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/services', changefreq: 'weekly', priority: 0.9 },
  { url: '/about', changefreq: 'monthly', priority: 0.8 },
  { url: '/gallery', changefreq: 'weekly', priority: 0.7 },
  { url: '/contact', changefreq: 'monthly', priority: 0.8 },
  { url: '/booking', changefreq: 'monthly', priority: 0.9 },
  { url: '/reviews', changefreq: 'weekly', priority: 0.7 },
  { url: '/privacy-policy', changefreq: 'yearly', priority: 0.3 },
  { url: '/terms-of-service', changefreq: 'yearly', priority: 0.3 },
]

// Service categories (can be fetched from database in production)
const SERVICE_CATEGORIES = [
  'therapeutic',
  'surgical',
  'orthopedic',
  'orthodontics',
  'aesthetic',
  'pediatric',
]

/**
 * Format date to W3C datetime format
 */
function formatDate(date) {
  return date.toISOString()
}

/**
 * Generate XML sitemap
 */
function generateSitemap() {
  const now = new Date()
  const lastmod = formatDate(now)

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
  xml +=
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n'
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'

  // Add static pages
  STATIC_PAGES.forEach(page => {
    xml += '  <url>\n'
    xml += `    <loc>${SITE_URL}${page.url}</loc>\n`
    xml += `    <lastmod>${lastmod}</lastmod>\n`
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`
    xml += `    <priority>${page.priority}</priority>\n`

    // Add alternate language links (for future i18n)
    xml += `    <xhtml:link rel="alternate" hreflang="uk" href="${SITE_URL}${page.url}" />\n`

    xml += '  </url>\n'
  })

  // Add service category pages (if implemented)
  SERVICE_CATEGORIES.forEach(category => {
    xml += '  <url>\n'
    xml += `    <loc>${SITE_URL}/services/${category}</loc>\n`
    xml += `    <lastmod>${lastmod}</lastmod>\n`
    xml += `    <changefreq>monthly</changefreq>\n`
    xml += `    <priority>0.6</priority>\n`
    xml += '  </url>\n'
  })

  xml += '</urlset>'

  return xml
}

/**
 * Main function
 */
function main() {
  console.log('🗺️  Generating sitemap.xml...')

  try {
    const sitemap = generateSitemap()
    fs.writeFileSync(OUTPUT_PATH, sitemap, 'utf-8')

    console.log('✅ Sitemap generated successfully!')
    console.log(`📁 Location: ${OUTPUT_PATH}`)
    console.log(`🌐 URL: ${SITE_URL}/sitemap.xml`)

    // Calculate size
    const stats = fs.statSync(OUTPUT_PATH)
    console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`)

    // Count URLs
    const urlCount = (sitemap.match(/<url>/g) || []).length
    console.log(`🔗 URLs: ${urlCount}`)
  } catch (error) {
    console.error('❌ Error generating sitemap:', error.message)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { generateSitemap }
