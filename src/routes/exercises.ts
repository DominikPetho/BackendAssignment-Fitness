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
	ProgramWithExercise,
	CompletedExercise
} = models

export default () => {
	// Helper function to build pagination options
	const buildPaginationOptions = (page?: string, limit?: string) => {
		// If neither page nor limit is provided, return null to indicate no pagination
		if (!page && !limit) {
			return null
		}

		const pageNumber = parseInt(page || '1', 10)
		const limitNumber = parseInt(limit || '10', 10)

		// Ensure reasonable limits
		const maxLimit = 50
		const actualLimit = Math.min(limitNumber, maxLimit)
		const offset = (pageNumber - 1) * actualLimit

		return {
			limit: actualLimit,
			offset: offset,
			page: pageNumber
		}
	}

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

	// Public route - get all exercises with optional program filter, search, and pagination
	router.get('/', async (req, res) => {
		try {
			const { programID, search, page, limit } = req.query

			const whereClause = buildSearchWhereClause(search as string)
			const includeClause = buildProgramIncludeClause(programID as string)
			const paginationOptions = buildPaginationOptions(page as string, limit as string)

			// Build query options
			const queryOptions: any = {
				where: whereClause,
				include: includeClause,
				attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
			}

			// Add pagination only if pagination options are provided
			if (paginationOptions) {
				queryOptions.limit = paginationOptions.limit
				queryOptions.offset = paginationOptions.offset
			}

			const exercises = await Exercise.findAndCountAll(queryOptions)

			if (exercises.rows.length === 0) {
				const message = buildErrorMessage(programID as string, search as string)
				return res.json(createErrorResponse(message))
			} else {
				// If pagination is not applied, return simple array
				if (!paginationOptions) {
					return res.json(exercises.rows)
				}

				// If pagination is applied, return structured response
				const totalPages = Math.ceil(exercises.count / paginationOptions.limit)
				const response = {
					data: exercises.rows,
					pagination: {
						currentPage: paginationOptions.page,
						totalPages,
						totalItems: exercises.count,
						hasNextPage: paginationOptions.page < totalPages,
					}
				}
				return res.json(response)
			}
		} catch (error) {
			return res.status(500).json(createErrorResponse('exercise.fetchFailed'))
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
				return res.status(404).json(createErrorResponse('exercise.notFound'))
			}

			return res.json(exercise.programs)
		} catch (error) {
			return res.status(500).json(createErrorResponse('exercise.getProgramsFailed'))
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
				return res.status(400).json(createErrorResponse('exercise.alreadyExists'))
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
			return res.status(500).json(createErrorResponse('exercise.createFailed'))
		}
	})

	// Update exercise
	router.patch('/:id', authenticateJWT, requireAdmin, validateRequest(updateExerciseSchema), async (req: ValidatedRequest<UpdateExerciseInput>, res) => {
		try {
			const { id } = req.params
			const { name, difficulty } = req.validatedBody

			const exercise = await Exercise.findByPk(id)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('exercise.notFound'))
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
					return res.status(400).json(createErrorResponse('exercise.alreadyExists'))
				}
			}

			await exercise.update({
				name,
				difficulty
			})

			return res.json(exercise)
		} catch (error) {
			return res.status(500).json(createErrorResponse('exercise.updateFailed'))
		}
	})

	// Delete exercise
	router.delete('/:id', authenticateJWT, requireAdmin, async (req, res) => {
		try {
			const { id } = req.params

			const exercise = await Exercise.findByPk(id)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('exercise.notFound'))
			}

			// Try to delete the exercise - foreign key constraints will prevent deletion if completed exercises exist
			await exercise.destroy()

			return res.json(createSuccessResponse('exercise.deleted'))
		} catch (error) {
			return res.status(500).json(createErrorResponse('exercise.deleteFailed', error))
		}
	})

	// Add exercise to program
	router.post('/:id', authenticateJWT, requireAdmin, async (req, res) => {
		try {
			const { id } = req.params
			const { programID } = req.body

			const exercise = await Exercise.findByPk(id)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('exercise.notFound'))
			}

			const program = await Program.findByPk(programID)
			if (!program) {
				return res.status(404).json(createErrorResponse('program.notFound'))
			}

			// Check if the association already exists
			const existingAssociation = await ProgramWithExercise.findOne({
				where: {
					exerciseID: id,
					programID: programID
				}
			})

			if (existingAssociation) {
				return res.status(400).json(createErrorResponse('exercise.alreadyInProgram'))
			}

			await ProgramWithExercise.create({
				exerciseID: id,
				programID: programID
			})

			return res.json(createSuccessResponse('exercise.addedToProgram'))
		} catch (error) {
			return res.status(500).json(createErrorResponse('exercise.addToProgramFailed'))
		}
	})

	// Remove exercise from program
	router.delete('/', authenticateJWT, requireAdmin, async (req, res) => {
		try {
			const { programId, exerciseId } = req.body

			const exercise = await Exercise.findByPk(exerciseId)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('exercise.notFound'))
			}

			// Find and delete the association
			const association = await ProgramWithExercise.findOne({
				where: {
					exerciseID: exerciseId,
					programID: programId
				}
			})

			if (!association) {
				return res.status(404).json(createErrorResponse('exercise.notInProgram'))
			}

			await association.destroy()

			return res.json(createSuccessResponse('exercise.removedFromProgram'))
		} catch (error) {
			return res.status(500).json(createErrorResponse('exercise.removeFromProgramFailed'))
		}
	})

	return router
}

