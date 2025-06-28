import { Router } from 'express'

import { models } from '../db'

const router: Router = Router()

const {
	Program
} = models

export default () => {
	router.get('/', async (_, res) => {
		const programs = await Program.findAll()
		return res.json({
			data: programs,
			message: 'List of programs'
		})
	})

	return router
}
