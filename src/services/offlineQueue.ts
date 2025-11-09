/**
 * Offline queue service for storing and syncing form submissions when offline
 */

export interface QueuedSubmission {
  id: string
  type: 'contact' | 'booking' | 'feedback'
  data: Record<string, unknown>
  timestamp: number
  retries: number
  status: 'pending' | 'syncing' | 'failed'
}

const QUEUE_KEY = 'offline_submission_queue'
const MAX_RETRIES = 3

/**
 * Add a submission to the offline queue
 */
export function addToQueue(
  type: QueuedSubmission['type'],
  data: Record<string, unknown>
): void {
  try {
    const queue = getQueue()

    const submission: QueuedSubmission = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    }

    queue.push(submission)
    saveQueue(queue)

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`Added ${type} submission to offline queue`)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to add submission to queue:', error)
  }
}

/**
 * Get all queued submissions
 */
export function getQueue(): QueuedSubmission[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Save queue to localStorage
 */
function saveQueue(queue: QueuedSubmission[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('Failed to save queue:', error)
  }
}

/**
 * Remove a submission from the queue
 */
export function removeFromQueue(id: string): void {
  try {
    const queue = getQueue()
    const filtered = queue.filter(item => item.id !== id)
    saveQueue(filtered)
  } catch (error) {
    console.error('Failed to remove from queue:', error)
  }
}

/**
 * Update submission status
 */
export function updateSubmissionStatus(
  id: string,
  status: QueuedSubmission['status']
): void {
  try {
    const queue = getQueue()
    const updated = queue.map(item =>
      item.id === id ? { ...item, status } : item
    )
    saveQueue(updated)
  } catch (error) {
    console.error('Failed to update submission status:', error)
  }
}

/**
 * Increment retry count for a submission
 */
export function incrementRetries(id: string): void {
  try {
    const queue = getQueue()
    const updated = queue.map(item =>
      item.id === id ? { ...item, retries: item.retries + 1 } : item
    )
    saveQueue(updated)
  } catch (error) {
    console.error('Failed to increment retries:', error)
  }
}

/**
 * Sync all pending submissions
 */
export async function syncQueue(): Promise<{
  synced: number
  failed: number
}> {
  const queue = getQueue()
  const pending = queue.filter(item => item.status === 'pending')

  let synced = 0
  let failed = 0

  for (const submission of pending) {
    // Skip if max retries exceeded
    if (submission.retries >= MAX_RETRIES) {
      updateSubmissionStatus(submission.id, 'failed')
      failed++
      continue
    }

    // Attempt to sync
    updateSubmissionStatus(submission.id, 'syncing')

    try {
      const success = await attemptSync(submission)

      if (success) {
        removeFromQueue(submission.id)
        synced++
      } else {
        incrementRetries(submission.id)
        updateSubmissionStatus(submission.id, 'pending')
        failed++
      }
    } catch (error) {
      console.error(`Failed to sync submission ${submission.id}:`, error)
      incrementRetries(submission.id)
      updateSubmissionStatus(submission.id, 'pending')
      failed++
    }
  }

  return { synced, failed }
}

/**
 * Attempt to sync a single submission
 */
async function attemptSync(submission: QueuedSubmission): Promise<boolean> {
  const { type, data } = submission

  try {
    let endpoint: string

    switch (type) {
      case 'contact':
        endpoint = '/api/contacts'
        break
      case 'booking':
        endpoint = '/api/appointments'
        break
      case 'feedback':
        endpoint = '/api/feedback'
        break
      default:
        return false
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    return response.ok
  } catch {
    return false
  }
}

/**
 * Get queue statistics
 */
export function getQueueStats(): {
  total: number
  pending: number
  syncing: number
  failed: number
} {
  const queue = getQueue()

  return {
    total: queue.length,
    pending: queue.filter(item => item.status === 'pending').length,
    syncing: queue.filter(item => item.status === 'syncing').length,
    failed: queue.filter(item => item.status === 'failed').length,
  }
}

/**
 * Clear all failed submissions
 */
export function clearFailedSubmissions(): void {
  try {
    const queue = getQueue()
    const filtered = queue.filter(item => item.status !== 'failed')
    saveQueue(filtered)
  } catch (error) {
    console.error('Failed to clear failed submissions:', error)
  }
}

/**
 * Initialize background sync if available
 */
export function initBackgroundSync(): void {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    // Register for background sync
    navigator.serviceWorker.ready
      .then(registration => {
        // @ts-expect-error - Background Sync API types not fully supported
        return registration.sync?.register('sync-offline-queue')
      })
      .catch(error => {
        console.error('Failed to register background sync:', error)
      })
  }
}

/**
 * Listen for online event and sync queue
 */
export function setupOnlineListener(): void {
  window.addEventListener('online', () => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('Back online! Syncing offline queue...')
    }
    syncQueue().then(result => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log(
          `Synced ${result.synced} submissions, ${result.failed} failed`
        )
      }
    })
  })
}
