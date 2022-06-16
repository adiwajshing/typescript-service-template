import './get-connection'
import process from 'process'
import * as opentelemetry from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-grpc'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import logger from './logger'
import { SERVICE_NAME } from '../config.json'
// configure the SDK to export telemetry data to the console
// enable all auto-instrumentations from the meta package
const traceExporter = new OTLPTraceExporter();
const sdk = new opentelemetry.NodeSDK({
	resource: new opentelemetry.resources.Resource({
		[SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
	}),
	traceExporter,
	//@ts-ignore
	instrumentations: [getNodeAutoInstrumentations()]
})

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk.start()
	.then(() => logger.info('tracing initialized'))
	.catch(err => logger.error({ err }, 'error initializing tracing'))

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
	sdk.shutdown()
		.then(() => console.log('Tracing terminated'))
		.catch((error) => console.log('Error terminating tracing', error))
		.finally(() => process.exit(0))
})