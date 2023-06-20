import pino, { Logger } from 'pino'

let pinoLogger: Logger

if (process.env.NODE_ENV === 'development') {
  pinoLogger = pino({
    level: 'debug',
    transport: {
      target: 'pino-pretty',
    },
  })
} else {
  pinoLogger = pino({
    level: 'info',
  })
}

export { pinoLogger }
