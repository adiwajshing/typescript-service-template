import env from '../utils/env'
env()

import { Application } from 'express'
import makeTestServer from './make-test-server'
import getConnection from '../utils/get-connection'

export const describeWithApp = (
	name: string,
	tests: (
        app: Application
    ) => void,
) => describe(name, () => {
	const app = makeTestServer()

	afterAll(async() => {
		const db = await getConnection()
		await db.disconnect()
	})

	tests(app)
})

jest.setTimeout(30_000)