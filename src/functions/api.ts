// eslint-disable-next-line simple-import-sort/imports
import '../utils/env'

import { APIGatewayProxyEvent, Context } from 'aws-lambda'
import ROUTES from '../routes'
import makeApi from '../utils/make-api'

export const api = makeApi('openapi.yaml', ROUTES)

export const handler = (event: APIGatewayProxyEvent, context: Context) => {
	return api.then(
		api => (
			api.handleRequest(
				{
					method: event.httpMethod,
					path: event.path,
					body: event.body,
					query: event.queryStringParameters as { [_: string]: string | string[] },
					headers: event.headers as { [_: string]: string | string[] },
				},
				event,
				context,
			)
		)
	)
}
