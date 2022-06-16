import P from 'pino'
// the default logger instance from which all child loggers are derived
const logger = P({ })
logger.level = process.env.LOG_LEVEL || 'info'

export default logger