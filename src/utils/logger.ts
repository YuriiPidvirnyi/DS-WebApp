type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogRecord {
  level: LogLevel
  msg: string
  ts: string
  [key: string]: unknown
}

function emit(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  // Suppress everything in test to keep unit test output clean
  if (process.env.NODE_ENV === 'test') return

  // Suppress debug in production
  if (process.env.NODE_ENV === 'production' && level === 'debug') return

  const record: LogRecord = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...meta,
  }

  // Always emit structured JSON (stdout via console.log as specified)
  const line = JSON.stringify(record)
  console.log(line)
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) =>
    emit('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) =>
    emit('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    emit('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    emit('error', msg, meta),
}
