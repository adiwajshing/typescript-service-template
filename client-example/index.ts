/**
 * Before running this example:
 * 1. Ensure the client is generated (`npm run generate:client`)
 * 2. CD into the client directory
 * 3. Run `npm i`
 * 4. Run `npm run build`
 *
 * This example simply creates & fetches users on a regular interval
 */
import { Configuration, UsersApi } from '@adiwajshing/typescript-service-client'
import { Chance } from 'chance'

const API_PATH = 'http://localhost:3001/v0'

const chance = new Chance()

const makeAndGetUsers = async() => {
	const api = new UsersApi(new Configuration({ basePath: API_PATH }))
	const { data } = await api.usersPost({
		userCreate: {
			name: chance.name(),
			age: chance.age()
		}
	})
	console.log('made user ', data)

	const { data: users } = await api.usersGet({ count: 10 })
	console.log(`got ${users.users.length} users`)
}

setInterval(() => {
	makeAndGetUsers()
}, 20_000)

makeAndGetUsers()