import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-grpc'
import { AwsLambdaInstrumentation } from '@opentelemetry/instrumentation-aws-lambda'
import * as opentelemetry from '@opentelemetry/sdk-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import process from 'process'
import { SERVICE_NAME } from '../config.json'
import logger from './logger'

// configure the SDK to export telemetry data to the console
// enable all auto-instrumentations from the meta package
const traceExporter = new OTLPTraceExporter()
const sdk = new opentelemetry.NodeSDK({
	resource: new opentelemetry.resources.Resource({
		[SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
	}),
	traceExporter,
	//@ts-ignore
	instrumentations: [
		getNodeAutoInstrumentations(),
		new AwsLambdaInstrumentation({
			disableAwsContextPropagation: true
		})
	]
})

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk.start()
	.then(() => logger.info('tracing initialized'))
	.catch(err => logger.error({ err }, 'error initializing tracing'))

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
	sdk.shutdown()
		.then(() => logger.info('Tracing terminated'))
		.catch(err => logger.error({ err }, 'Error terminating tracing'))
		.finally(() => process.exit(0))
})
