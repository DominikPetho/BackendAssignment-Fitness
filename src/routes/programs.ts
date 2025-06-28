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

	router.get('/:id', async (req, res) => {
		try {
			const { id } = req.params

			const program = await Program.findByPk(id, {
				include: [{
					model: Exercise,
					as: 'exercises',
					attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
					through: { attributes: [] }
				}],
				attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
			})

			if (!program) {
				return res.status(404).json(createErrorResponse('Program not found'))
			}

			return res.json(program)
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to get program'))
		}
	})

	return router
}
