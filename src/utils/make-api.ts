import { Boom } from '@hapi/boom'
import addFormats from 'ajv-formats'
import { Context } from 'aws-lambda'
import OpenAPIBackend, { Handler as APIHandler } from 'openapi-backend'
import { Logger } from 'pino'
import { operations } from '../types/gen'
import { authenticate, AuthUser, userCanAccess } from './auth-controller'
import getConnection from './get-connection'
import MAIN_LOGGER from './logger'

const DEFAULT_AUTH_SCHEME = 'token'

// a default health check route that always returns 200
// if the server is running
const HEALTH_CHECK_ROUTE = '/health-check'

/**
 * Main file with almost all the boilerplate required
 * for auth, wrapping a pure function into an HTTP controller etc.
 */
// get all operations from openAPI
export type Operation = keyof operations

// add missing parameters
// (not all operations have all these, so we add them)
type FullOp<O extends Operation> = operations[O] & {
    parameters: {
        path: {}
        query: {}
    }
    requestBody: {
        content: {
            'application/json': {}
        }
    },
    responses: {
        '200': {
            content: {
                'application/json': {} | void
            }
        }
    }
}

export type Authentication = { [DEFAULT_AUTH_SCHEME]: AuthUser }
// the JSON request body of a given operation
export type requestBody<O extends Operation> = FullOp<O>['requestBody']['content']['application/json']
// full request type of an operation -- query + parameters + requestBody
export type FullRequest<O extends Operation> =
    FullOp<O>['parameters']['query'] &
    FullOp<O>['parameters']['path'] &
    requestBody<O>
// the response type of an operation
export type Response<O extends Operation> = FullOp<O>['responses']['200']['content']['application/json']
// handle cleaned up request (type checks response too)
export type Handler<O extends Operation> = (
    ev: FullRequest<O>,
    auth: Authentication,
    logger: Logger
) => Promise<Response<O>>

export type GetHandler<O extends Operation> = () => (Promise<Handler<O>> | Handler<O>)

export type APIResult = { statusCode: number, body: any }

// extra headers to add to every request
const headers = {
	'content-type': 'application/json',
	// basically allow requests from any domain
	// useful if you have an API that can be accessed from anywhere
	'access-control-allow-headers': 'authorization,Authorization,content-type,Content-Type,sentry-trace',
	'access-control-allow-origin': '*', // lazy cors config
	'access-control-allow-methods': 'get,post,patch,delete,put,GET,POST,PATCH,DELETE,PUT',
}

// HTTP methods to log
const METHODS_TO_LOG = new Set([ 'delete', 'post', 'patch' ])

// backend agnostic wrapper
// makes a request handler work for serverless, express & others
function errorHandlingWrap<O extends Operation>(getHandler: GetHandler<O>): APIHandler {
	return async(e, req, ctx: Context) => {
		const logger = MAIN_LOGGER.child({ requestId: ctx?.awsRequestId || 'unknown' })
		const result = {} as APIResult
		const query = {
			...(e.request.query || {}),
			...(req?.multiValueQueryStringParameters || {})
		}
		Object.keys(query).forEach(key => {
			if(!!query[key] && Array.isArray(query[key]) && query[key]?.length === 1) {
				query[key] = query[key]![0]
			}
		})

		const fullRequest = { // combine all params
			...query,
			...(e.request.requestBody || {}),
			...(e.request.params || {})
		}

		let auth: Authentication | undefined = undefined
		let trace: string | undefined = undefined
		try {
			if(e.validation?.errors) {
				throw new Boom('Invalid request', { statusCode: 400, data: e.validation.errors })
			}

			// if auth failed
			if(e.security && !e.security.authorized && DEFAULT_AUTH_SCHEME in e.security) {
				throw e.security[DEFAULT_AUTH_SCHEME].error
			}

			auth = e.security as Authentication

			// allow everything if OPTIONS
			// pass if it's the health check route
			if(e.request.path !== HEALTH_CHECK_ROUTE && e.request.method !== 'options') {
				// ensure mongo connection is open
				await getConnection()
				// retreive the request handler
				const handler = await getHandler()
				// execute the request handler
				result.body = await handler(fullRequest, auth, logger)
			}

			result.statusCode = 200
		} catch(error) {
			let errorDescription: string
			let data: any

			trace = error.stack
			if(error instanceof Boom) {
				errorDescription = error.message
				data = error.data
				result.statusCode = error.output.statusCode
			} else {
				errorDescription = 'Internal Server Error'
				result.statusCode = 500
			}

			result.body = {
				error: errorDescription,
				statusCode: result.statusCode,
				message: error.message,
				data
			}
		}

		if(trace || METHODS_TO_LOG.has(e.request.method)) {
			const method = trace ? 'error' : 'info'
			logger[method]({
				trace,
				path: `${ e.request.method } ${ e.request.path }`,
				res: result.body,
				req: fullRequest,
				statusCode: result.statusCode,
				actor: auth?.[DEFAULT_AUTH_SCHEME]
			}, 'processed request')
		}

		const res = (e.request as any)['res']
		if(typeof res?.status === 'function') {
			res.set(headers)
			return res
				.status(result.statusCode)
				.send(result.body)
		} else {
			return {
				statusCode: result.statusCode,
				body: JSON.stringify(result.body),
				headers
			}
		}
	}
}

export default async(definition: string, routes: { [O in Operation]: GetHandler<O> }) => {
	// create api with your definition file or object
	const api = new OpenAPIBackend({
		definition,
		customizeAjv: ajv => addFormats(ajv),
		quick: process.env.NODE_ENV === 'production',
	})

	// uncomment for when we've auth
	api.registerSecurityHandler(DEFAULT_AUTH_SCHEME, async e => {
		try {
			const headers = e.request.headers
			const [security] = e.operation.security!
			const scopes = security[DEFAULT_AUTH_SCHEME]

			// remove "Bearer " prefix
			const token = (headers.Authorization || headers.authorization)?.slice(7)
			if(!token || typeof token !== 'string') {
				throw new Boom('Missing auth token', { statusCode: 401 })
			}

			const authUser = await authenticate(token)

			if(typeof authUser === 'boolean') {
				throw new Boom('Token expired', { statusCode: 401 })
			}

			if(!userCanAccess(authUser, scopes)) {
				// noinspection ExceptionCaughtLocallyJS
				throw new Boom('Insufficient Access', { statusCode: 403 })
			}

			return authUser
		} catch(error) {
			if(error instanceof Boom) {
				throw error
			} else if(error instanceof TypeError) {
				const boom = new Boom('Whoops, something went seriously wrong.')
				boom.stack = error.stack // so we can log & trace this later
				throw boom
			} else {
				throw new Boom(error.message, { statusCode: error.code || 401 })
			}
		}
	})

	const routeList = Object.keys(routes) as (keyof typeof routes)[]

	api.register({
		notFound: errorHandlingWrap(() => {
			return async() => {
				throw new Boom('Not Found', { statusCode: 404 })
			}
		}),
		validationFail: errorHandlingWrap<any>(async() => {
			return async() => { }
		}),
		...routeList.reduce(
			(dict, key) => {
				// @ts-expect-error
				dict[key] = errorHandlingWrap(routes[key])
				return dict
			},
			{ } as { [_: string]: APIHandler }
		)
	})

	// initialize the backend
	const result = await api.init()
	return result
}
