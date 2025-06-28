import { Router } from 'express'

import { models } from '../db'
import { createErrorResponse } from '../types/response/message'

const router: Router = Router()

const {
	Program,
	Exercise
} = models

export default () => {
	router.get('/', async (_, res) => {
		const programs = await Program.findAll({
			include: [{
				model: Exercise,
				as: 'exercises',
				attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
				through: { attributes: [] }
			}],
			attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
		})
		return res.json(programs)
	})

	return router
}
