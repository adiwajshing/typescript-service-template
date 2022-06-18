import { readdir, stat, writeFile } from 'fs/promises'
import { join, parse, } from 'path'

const ROUTES_FOLDER = 'src/routes'
// from: https://stackoverflow.com/questions/57556471/convert-kebab-case-to-camelcase-with-javascript
const camelize = (s: string) => s.replace(/-./g, x => x[1].toUpperCase())

const readdirRecursive = async(dir: string): Promise<string[]> => {
	const subdirs = await readdir(dir)
	const files = await Promise.all(
		subdirs.map(
			async(subdir) => {
				const res = join(dir, subdir)
				return (await stat(res)).isDirectory() ? readdirRecursive(res) : [res]
			}
		)
	)
	return files.reduce((a, f) => a.concat(f), [])
}

/**
 * Generates the index file at src/routes
 * The index file contains a route map used by the `make-api` utility
 * the map helps the `make-api` utility map each route's handler correctly
 */
const generateRoutesIndex = async() => {
	const files = await readdirRecursive(ROUTES_FOLDER)
	let indexTs = '//generated file, run \'yarn generate:routes-index\' to update\n\nexport default {\n'
	for(let file of files) {
		const { name, ext } = parse(file)
		if(ext.endsWith('ts') && name !== 'index') {
			// strip relative path, use path from inside routes folder
			// also -3 to remove ".ts" extension
			file = '.' + file.slice(ROUTES_FOLDER.length, -3)
			indexTs += `\t${camelize(name)}: async() => (await import('${file}')).default,\n`
		}
	}

	indexTs += '}'

	await writeFile(join(ROUTES_FOLDER, 'index.ts'), indexTs)
	console.log('updated routes')
}

generateRoutesIndex()