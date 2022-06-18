import mongoose, { connect, set } from 'mongoose'
import './env'
import logger from './logger'

let mongo: Promise<typeof mongoose>
const getConnection = async(): Promise<typeof mongoose> => {
	// // globally replace _id with id
	set('toJSON', {
		virtuals: true,
		versionKey: false,
		transform: (doc, converted) => {
			delete converted._id
		}
	})

	const uri = process.env.MONGO_URI
	if(!uri) {
		throw new Error('DB URI absent')
	}

	if(!mongo) {
		mongo = (
			connect(uri, { connectTimeoutMS: 5_000 })
				.then(
					m => {
						logger.info('connected to mongo')
						return m
					}
				)
		)
	}

	return mongo
}

export default getConnection
