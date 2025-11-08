#!/usr/bin/env node
/**
 * Custom preview server with proper SPA fallback for E2E tests
 * This solves the issue where Vite preview server doesn't serve index.html for client-side routes
 */

import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4173
const DIST_DIR = path.resolve(__dirname, '../dist')

// Check if dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error(
    '❌ Error: dist directory not found. Run "npm run build" first.'
  )
  process.exit(1)
}

// Serve static files from dist
app.use(
  express.static(DIST_DIR, {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    index: false, // Disable automatic index.html serving
  })
)

// SPA fallback - serve index.html for all non-asset routes
app.use((req, res) => {
  // If request has extension and file exists, it was already served by static middleware
  // Otherwise serve index.html (for SPA routes)
  const indexPath = path.join(DIST_DIR, 'index.html')

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('index.html not found')
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`
✅ Preview server running at:
   
   Local:   http://localhost:${PORT}
   Network: http://$(hostname -I | awk '{print $1}'):${PORT}
   
   Serving: ${DIST_DIR}
   
   Press Ctrl+C to stop
  `)
})

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('Shutting down preview server...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\nShutting down preview server...')
  process.exit(0)
})
