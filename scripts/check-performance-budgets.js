#!/usr/bin/env node
/**
 * Performance Budget Checker
 *
 * Validates bundle sizes and performance metrics against defined budgets
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import zlib from 'zlib'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.resolve(__dirname, '../dist')
const BUDGETS_FILE = path.resolve(__dirname, '../.performance-budgets.json')

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`
}

function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath)
  const gzipped = zlib.gzipSync(content)
  return gzipped.length
}

function matchFiles(pattern) {
  const assetsDir = path.join(DIST_DIR, 'assets')
  if (!fs.existsSync(assetsDir)) return []

  const files = fs.readdirSync(assetsDir)
  const regex = pattern
    .replace(/\*/g, '.*')
    .replace(/\.js$/, '\\.js$')
    .replace(/\.css$/, '\\.css$')

  const matched = files.filter(file => new RegExp(regex).test(file))
  return matched.map(file => path.join(assetsDir, file))
}

function checkBundleSizes(budgets) {
  log('\n📦 Checking Bundle Sizes...', 'blue')

  const results = []
  let allPassed = true

  for (const fileConfig of budgets.files) {
    const pattern = fileConfig.path
      .replace('dist/assets/', '')
      .replace('dist/', '')

    const files = matchFiles(pattern)

    if (files.length === 0) {
      log(`  ⚠️  No files matched pattern: ${pattern}`, 'yellow')
      continue
    }

    for (const file of files) {
      const stats = fs.statSync(file)
      const actualSize =
        fileConfig.compression === 'gzip' ? getGzipSize(file) : stats.size

      const maxSizeBytes = parseInt(fileConfig.maxSize) * 1024
      const passed = actualSize <= maxSizeBytes
      const percentage = ((actualSize / maxSizeBytes) * 100).toFixed(1)

      results.push({
        file: path.basename(file),
        actualSize,
        maxSize: maxSizeBytes,
        passed,
        percentage,
      })

      const icon = passed ? '✅' : '❌'
      const color = passed ? 'green' : 'red'

      log(
        `  ${icon} ${path.basename(file)}: ${formatBytes(actualSize)} / ${formatBytes(maxSizeBytes)} (${percentage}%)`,
        color
      )

      if (!passed) allPassed = false
    }
  }

  return { results, passed: allPassed }
}

function checkLighthouseMetrics(budgets) {
  log('\n⚡ Lighthouse Performance Budgets:', 'blue')

  Object.entries(budgets.metrics).forEach(([metric, config]) => {
    log(
      `  ${metric}: ${config.budget}${config.unit === 'millisecond' ? 'ms' : ''}`
    )
  })

  log('\n  ℹ️  These will be checked by Lighthouse CI in GitHub Actions')
}

function checkThresholds(budgets) {
  log('\n🎯 Performance Thresholds:', 'blue')

  Object.entries(budgets.thresholds).forEach(([category, threshold]) => {
    log(`  ${category}: ${(threshold * 100).toFixed(0)}%`)
  })
}

function generateSummary(bundleResults) {
  log('\n' + '='.repeat(60), 'bold')
  log('📊 Performance Budget Summary', 'bold')
  log('='.repeat(60), 'bold')

  const totalFiles = bundleResults.results.length
  const passedFiles = bundleResults.results.filter(r => r.passed).length
  const failedFiles = totalFiles - passedFiles

  log(`\n  Total files checked: ${totalFiles}`)
  log(`  Passed: ${passedFiles}`, 'green')

  if (failedFiles > 0) {
    log(`  Failed: ${failedFiles}`, 'red')
    log('\n  ⚠️  Some bundles exceed their size budgets!', 'yellow')
    log(
      '  Consider code splitting or lazy loading to reduce bundle sizes.\n',
      'yellow'
    )
  } else {
    log('\n  ✨ All bundles are within budget! 🎉\n', 'green')
  }

  return failedFiles === 0
}

function main() {
  try {
    log('\n🚀 Performance Budget Check', 'bold')
    log('='.repeat(60))

    // Check if dist directory exists
    if (!fs.existsSync(DIST_DIR)) {
      log(
        '\n❌ Error: dist directory not found. Run `npm run build` first.\n',
        'red'
      )
      process.exit(1)
    }

    // Load budgets
    const budgets = JSON.parse(fs.readFileSync(BUDGETS_FILE, 'utf-8'))

    // Check bundle sizes
    const bundleResults = checkBundleSizes(budgets)

    // Check Lighthouse metrics (informational)
    checkLighthouseMetrics(budgets)

    // Check thresholds (informational)
    checkThresholds(budgets)

    // Generate summary
    const passed = generateSummary(bundleResults)

    if (!passed) {
      process.exit(1)
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}\n`, 'red')
    console.error(error)
    process.exit(1)
  }
}

main()
