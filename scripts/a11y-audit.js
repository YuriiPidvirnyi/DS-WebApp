const { chromium } = require('playwright')
const { injectAxe, checkA11y, getViolations } = require('@axe-core/playwright')

async function runA11yAudit() {
  console.log('🚀 Starting Accessibility Audit...\n')
  
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Pages to audit
  const pagesToAudit = [
    { name: 'Home', url: 'http://localhost:3000/' },
    { name: 'Services', url: 'http://localhost:3000/services' },
    { name: 'About', url: 'http://localhost:3000/about' },
    { name: 'Contact', url: 'http://localhost:3000/contact' },
    { name: 'Gallery', url: 'http://localhost:3000/gallery' },
    { name: 'Booking', url: 'http://localhost:3000/booking' }
  ]

  const auditResults = []

  for (const pageInfo of pagesToAudit) {
    console.log(`🔍 Auditing ${pageInfo.name} page...`)
    
    try {
      await page.goto(pageInfo.url, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000) // Wait for content to load
      
      await injectAxe(page)
      
      const results = await page.evaluate(async () => {
        return await window.axe.run()
      })

      const violations = results.violations.filter(v => 
        !['color-contrast'].includes(v.id) || v.impact !== 'minor'
      )

      auditResults.push({
        page: pageInfo.name,
        url: pageInfo.url,
        violations: violations,
        passes: results.passes.length,
        total: results.violations.length
      })

      if (violations.length === 0) {
        console.log(`✅ ${pageInfo.name}: No accessibility violations found`)
      } else {
        console.log(`❌ ${pageInfo.name}: ${violations.length} violations found`)
        violations.forEach(violation => {
          console.log(`   - ${violation.id}: ${violation.description} (${violation.impact})`)
          violation.nodes.forEach(node => {
            console.log(`     Target: ${node.target}`)
          })
        })
      }
      
    } catch (error) {
      console.log(`❌ Error auditing ${pageInfo.name}: ${error.message}`)
    }
    console.log('')
  }

  await browser.close()

  // Summary report
  console.log('📊 ACCESSIBILITY AUDIT SUMMARY')
  console.log('================================')
  
  const totalViolations = auditResults.reduce((sum, result) => sum + result.violations.length, 0)
  const totalPasses = auditResults.reduce((sum, result) => sum + result.passes, 0)
  
  console.log(`Total pages audited: ${auditResults.length}`)
  console.log(`Total violations: ${totalViolations}`)
  console.log(`Total passes: ${totalPasses}`)
  
  auditResults.forEach(result => {
    const status = result.violations.length === 0 ? '✅' : '❌'
    console.log(`${status} ${result.page}: ${result.violations.length} violations`)
  })

  if (totalViolations === 0) {
    console.log('\n🎉 All pages passed accessibility audit!')
    process.exit(0)
  } else {
    console.log(`\n⚠️  Found ${totalViolations} accessibility issues to fix`)
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Run the audit
runA11yAudit().catch(error => {
  console.error('Audit failed:', error)
  process.exit(1)
})