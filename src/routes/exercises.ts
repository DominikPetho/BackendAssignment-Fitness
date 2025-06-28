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
	// Helper function to build search where clause
	const buildSearchWhereClause = (search?: string) => {
		if (!search) return {}

		return {
			name: {
				[Op.iLike]: `%${search}%` // Case-insensitive search using ILIKE
			}
		}
	}

	// Helper function to build program include clause
	const buildProgramIncludeClause = (programID?: string) => {
		if (!programID) {
			return [{
				model: Program,
				as: 'programs',
				attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] } as any,
				through: { attributes: [] } as any
			}]
		}

		return [{
			model: Program,
			as: 'programs',
			where: { id: programID },
			attributes: [] as any,
			through: { attributes: [] } as any,
			required: true
		}]
	}

	// Helper function to build error message
	const buildErrorMessage = (programID?: string, search?: string) => {
		if (programID && search) {
			return `No exercises found for program ${programID} matching "${search}"`
		} else if (programID) {
			return `No exercises found for program ${programID}`
		} else if (search) {
			return `No exercises found matching "${search}"`
		}
		return 'No exercises found'
	}

	// Public route - get all exercises with optional program filter and search
	router.get('/', async (req, res) => {
		try {
			const { programID, search } = req.query

			const whereClause = buildSearchWhereClause(search as string)
			const includeClause = buildProgramIncludeClause(programID as string)

			const exercises = await Exercise.findAll({
				where: whereClause,
				include: includeClause,
				attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
			})

			if (exercises.length === 0) {
				const message = buildErrorMessage(programID as string, search as string)
				return res.json(createErrorResponse(message))
			} else {
				return res.json(exercises)
			}
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to fetch exercises'))
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
			const { id } = req.params
			const { programID } = req.body

			const exercise = await Exercise.findByPk(id)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('Exercise not found'))
			}

			const program = await Program.findByPk(programID)
			if (!program) {
				return res.status(404).json(createErrorResponse('Program not found'))
			}

			// Check if the association already exists
			const existingAssociation = await ProgramWithExercise.findOne({
				where: {
					exerciseID: id,
					programID: programID
				}
			})

			if (existingAssociation) {
				return res.status(400).json(createErrorResponse('Exercise is already in this program'))
			}

			await ProgramWithExercise.create({
				exerciseID: id,
				programID: programID
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

