import { User } from '../entity'
import { Handler } from '../utils/make-api'

const usersPost: Handler<'usersPost'> = async({ name, age }) => {
	const user = await User.create({ name, age })
	return user
}

export default usersPost