import { Chance } from 'chance'
import { randomBytes } from 'crypto'
import request from 'supertest'
import { IUser } from '../types'
import { Response } from '../utils/make-api'
import { describeWithApp } from './test-setup'

const chance = new Chance()

describeWithApp('User Tests', app => {

	it('should create a user', async() => {
		for(let i = 0;i < 10;i++) {
			const req = {
				name: chance.name(),
				age: chance.integer({ min: 0, max: 150 })
			}
			const response = await request(app)
				.post('/users')
				.send(req)
				.expect(200)
				.then(res => res.body as Response<'usersPost'>)
			expect(response.age).toEqual(req.age)
			expect(response.name).toEqual(req.name)
			expect(response.id).toBeTruthy()
			expect(response.createdAt).toBeTruthy()
		}
	})

	it('should return the correct data with a q param', async() => {
		const searchString = randomBytes(8).toString('hex')
		await request(app)
			.post('/users')
			.send({
				name: searchString + ' abcd',
				age: chance.integer({ min: 0, max: 150 })
			})
			.expect(200)

		const { users }: Response<'usersGet'> = await request(app)
			.get('/users')
			.query({ q: searchString })
			.expect(200)
			.then(res => res.body)
		expect(users).toHaveLength(1)
		expect(users[0].name.includes(searchString)).toBeTruthy()
	})

	it('should correctly paginate data', async() => {
		const TOTAL_USERS = 51
		// all the users we create will have the same name
		// allows us to verify our pagination is working correctly
		const searchString = randomBytes(8).toString('hex')

		await Promise.all(
			[...Array(TOTAL_USERS)].map(
				() => (
					request(app)
						.post('/users')
						.send({
							name: searchString,
							age: chance.integer({ min: 0, max: 150 })
						})
						.expect(200)
				)
			)
		)

		const usersFetched: IUser[] = []
		let page: string | undefined = undefined
		// keep fetching till the API returns a response with no cursor
		// no cursor => no more results
		do {
			const { nextPageCursor, users }: Response<'usersGet'> = await request(app)
				.get('/users')
				.query({ count: 15, page, q: searchString })
				.expect(200)
				.then(res => res.body)
			if(nextPageCursor) {
				// check the right count was returned
				// if there is another page afterwards
				expect(users).toHaveLength(15)
			}

			// add to our total list
			usersFetched.push(...users)

			page = nextPageCursor
		} while(page)

		expect(usersFetched).toHaveLength(TOTAL_USERS)
	})
})