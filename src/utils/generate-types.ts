import { writeFile } from 'fs/promises'
import openapiTS, { SchemaObject } from 'openapi-typescript';

(async() => {
	const output = await openapiTS('./openapi.yaml', {
		formatter: (node: SchemaObject) => {
			if(node.format === 'date-time') {
				return 'Date | string'
			} // return the TypeScript “Date” type, as a string
		}
		// for all other schema objects, let openapi-typescript decide (return undefined)
	})
	await writeFile('./src/types/gen.ts', output)
})()
