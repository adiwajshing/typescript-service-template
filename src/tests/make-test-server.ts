import express from 'express'
import { api } from '../functions/api'

// Test with express -- since it's just easier
export default () => {
	const app = express()
	app.use(express.json({ limit: '6mb' }))  // simulate lambda limit
	app.use((req, res) => {
		api.then(api => api.handleRequest(req as any, req, res))
	})
	return app
}