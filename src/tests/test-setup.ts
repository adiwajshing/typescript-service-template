// eslint-disable-next-line simple-import-sort/imports
import '../utils/env'

import { Application } from 'express'
import getConnection from '../utils/get-connection'
import makeTestServer from './make-test-server'

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