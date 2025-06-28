import { Router, Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'
import { models } from '../db'
import { authenticateJWT, requireAdmin } from '../middleware/auth'
import { createErrorResponse, createSuccessResponse } from '../types/response/message'
import { validateRequest, createExerciseSchema, updateExerciseSchema, CreateExerciseInput, UpdateExerciseInput } from '../validation/admin'
import { ValidatedRequest } from '../validation/validation-interface'

const router: Router = Router()

const {
	Exercise,
	Program,
	User,
	ProgramWithExercise
} = models

export default () => {
	// Public route - get all exercises
	router.get('/', async (_, res) => {
		const exercises = await Exercise.findAll({
			include: [{
				model: Program,
				as: 'programs',
				attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
			}],
			attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
		})

		if (exercises.length === 0) {
			return res.json(createErrorResponse('No exercises found'))
		} else {
			return res.json(exercises)
		}
	})

	// Public route - get all programs for a specific exercise
	router.get('/:id/programs', async (req, res) => {
		try {
			const { id } = req.params

			const exercise = await Exercise.findByPk(id, {
				include: [{
					model: Program,
					as: 'programs',
					attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
				}],
				attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
			})

			if (!exercise) {
				return res.status(404).json(createErrorResponse('Exercise not found'))
			}

			return res.json(exercise.programs)
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to get exercise programs'))
		}
	})

	// ADMIN ONLY ROUTES

	// Create exercise
	router.post('/', authenticateJWT, requireAdmin, validateRequest(createExerciseSchema), async (req: ValidatedRequest<CreateExerciseInput>, res) => {
		try {
			const { name, difficulty, programID } = req.validatedBody

			// Check if exercise with same name already exists
			const existingExercise = await Exercise.findOne({ where: { name } })
			if (existingExercise) {
				return res.status(400).json(createErrorResponse('Exercise with this name already exists'))
			}

			const exercise = await Exercise.create({
				name,
				difficulty
			})

			if (programID) {
				await ProgramWithExercise.create({
					programID,
					exerciseID: exercise.id
				})
			}

			return res.status(201).json(exercise)
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to create exercise'))
		}
	})

	// Update exercise
	router.patch('/:id', authenticateJWT, requireAdmin, validateRequest(updateExerciseSchema), async (req: ValidatedRequest<UpdateExerciseInput>, res) => {
		try {
			const { id } = req.params
			const { name, difficulty } = req.validatedBody

			const exercise = await Exercise.findByPk(id)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('Exercise not found'))
			}

			// If name is being updated, check for duplicates
			if (name) {
				const existingExercise = await Exercise.findOne({
					where: {
						name,
						id: { [Op.ne]: id } // Exclude current exercise
					}
				})
				if (existingExercise) {
					return res.status(400).json(createErrorResponse('Exercise with this name already exists'))
				}
			}

			await exercise.update({
				name,
				difficulty
			})

			return res.json(exercise)
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to update exercise'))
		}
	})

	// Delete exercise
	router.delete('/:id', authenticateJWT, requireAdmin, async (req, res) => {
		try {
			const { id } = req.params

			const exercise = await Exercise.findByPk(id)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('Exercise not found'))
			}

			await exercise.destroy()

			return res.json(createSuccessResponse('Exercise deleted successfully'))
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to delete exercise'))
		}
	})

	// Add exercise to program
	router.post('/:id', authenticateJWT, requireAdmin, async (req, res) => {
		try {
			const { id, programId } = req.body

			const exercise = await Exercise.findByPk(id)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('Exercise not found'))
			}

			const program = await Program.findByPk(programId)
			if (!program) {
				return res.status(404).json(createErrorResponse('Program not found'))
			}

			// Check if the association already exists
			const existingAssociation = await ProgramWithExercise.findOne({
				where: {
					exerciseID: id,
					programID: programId
				}
			})

			if (existingAssociation) {
				return res.status(400).json(createErrorResponse('Exercise is already in this program'))
			}

			await ProgramWithExercise.create({
				exerciseID: id,
				programID: programId
			})

			return res.json(createSuccessResponse('Exercise added to program successfully'))
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to add exercise to program'))
		}
	})

	// Remove exercise from program
	router.delete('/', authenticateJWT, requireAdmin, async (req, res) => {
		try {
			const { programId, exerciseId } = req.body

			const exercise = await Exercise.findByPk(exerciseId)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('Exercise not found'))
			}

			// Find and delete the association
			const association = await ProgramWithExercise.findOne({
				where: {
					exerciseID: exerciseId,
					programID: programId
				}
			})

			if (!association) {
				return res.status(404).json(createErrorResponse('Exercise is not in this program'))
			}

			await association.destroy()

			return res.json(createSuccessResponse('Exercise removed from program successfully'))
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to remove exercise from program'))
		}
	})

	return router
}
