type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogRecord {
  level: LogLevel
  msg: string
  ts: string
  [key: string]: unknown
}

function emit(level: LogLevel, msg: string, ctx?: Record<string, unknown>) {
  const record: LogRecord = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...ctx,
  }

  if (process.env.NODE_ENV === 'production') {
    // Vercel log drain expects newline-delimited JSON
    const line = JSON.stringify(record)
    switch (level) {
      case 'error':
        console.error(line)
        break
      case 'warn':
        console.warn(line)
        break
      default:
        console.log(line)
    }
  } else {
    // Human-readable in development
    const prefix = `[${level.toUpperCase()}]`
    const ctxStr = ctx ? ` ${JSON.stringify(ctx)}` : ''
    switch (level) {
      case 'error':
        console.error(`${prefix} ${msg}${ctxStr}`)
        break
      case 'warn':
        console.warn(`${prefix} ${msg}${ctxStr}`)
        break
      default:
        console.log(`${prefix} ${msg}${ctxStr}`)
    }
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) =>
    emit('debug', msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) =>
    emit('error', msg, ctx),
}
