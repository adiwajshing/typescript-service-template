import logger from './logger'

let configured = false

/**
 * configure the environment
 */
export default () => {
	// ensure the environment is only configured once
	if(!configured) {
		// on serverless, the environment is already set
		// so dot env won't be available
		// in that case, just log and move on
		try {
			const dotenv = require('dotenv')
			const env = process.env.NODE_ENV || 'development'
			dotenv.config({ path: `.env.${env}` })
		} catch(error) {
			logger.debug('dotenv not found, did not load from file')
		}

		logger.info({ env: process.env.NODE_ENV }, 'configured environment')
	}

	configured = true
}