import { Boom } from '@hapi/boom'
import { User } from '../entity'
import { Handler } from '../utils/make-api'

const usersPatch: Handler<'usersPatch'> = async({ id, name, age }) => {
	if(!name && !age) {
		throw new Boom('No changes to apply', { statusCode: 400 })
	}

	// convert singular ID to an array, if only one was passed
	id = typeof id === 'string' ? [id] : id

	const result = await User
		.updateMany(
			{ _id: { $in: [id] } },
			{ $set: { name, age } }
		)
		.exec()
	return {
		usersAffected: result.modifiedCount
	}
}

export default usersPatch