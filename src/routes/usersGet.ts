import { FilterQuery } from 'mongoose'
import { User } from '../entity'
import { Handler } from '../utils/make-api'

const usersGet: Handler<'usersGet'> = async(
	{ id, count, q, page }
) => {
	count = +(count || 20)
	// if a singular ID is passed, convert to array
	// otherwise, let it be
	id = typeof id === 'string' ? [id] : id

	const filter: FilterQuery<typeof User> = { }
	if(page) {
		filter._id = { $lt: page }
	}

	if(q) {
		filter.name = { $regex: q }
	}

	const users = await User.find(filter).limit(count).sort({ _id: -1 })

	let nextPageCursor: string | undefined = undefined
	// if we fetched at least as many records as we asked for
	// it means we may have more results to fetch
	// hence, return a cursor to the next page
	if(users.length >= count) {
		nextPageCursor = users[users.length - 1].id
	}

	return { users, nextPageCursor }
}

export default usersGet