import { Router, Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { authenticateJWT, requireAdmin } from '../middleware/auth'
import { createErrorResponse, createSuccessResponse } from '../types/response/message'
import { validateRequest, createExerciseSchema, updateExerciseSchema, CreateExerciseInput, UpdateExerciseInput } from '../validation/admin'

const router: Router = Router()

const {
	Exercise,
	Program
} = models

// Custom interface for requests with validated body
interface ValidatedRequest<T> extends Request {
	validatedBody: T
}

export default () => {
	// Public route - get all exercises
	router.get('/', async (_req, res, _next: NextFunction) => {
		const exercises = await Exercise.findAll({
			where: {
				createdAt: null
			},
			include: [{
				model: Program,
				as: 'program',
				attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
			}],
			attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt', 'programID'] }
		})

		if (exercises.length === 0) {
			return res.json(createErrorResponse('No exercises found'))
		} else {
			return res.json({ exercises })
		}
	})

	// ADMIN ONLY ROUTES

	// Create new exercise
	router.post('/', authenticateJWT, requireAdmin, validateRequest(createExerciseSchema), async (req: ValidatedRequest<CreateExerciseInput>, res: Response, next: NextFunction) => {
		try {
			const { name, difficulty, programID } = req.validatedBody

			// Check if program exists if programID is provided
			if (programID) {
				const program = await Program.findByPk(programID)
				if (!program) {
					return res.status(404).json(createErrorResponse('Program not found'))
				}
			}

			const exercise = await Exercise.create({
				name,
				difficulty,
				programID: programID || null
			})

			return res.status(201).json(createSuccessResponse('Exercise created successfully'))
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to create exercise'))
		}
	})

	// Update exercise
	router.put('/:id', authenticateJWT, requireAdmin, validateRequest(updateExerciseSchema), async (req: ValidatedRequest<UpdateExerciseInput>, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params
			const { name, difficulty, programID } = req.validatedBody

			const exercise = await Exercise.findByPk(id, {
				attributes: { exclude: ['createdAt', 'updatedAt'] }
			})

			if (!exercise) {
				return res.status(404).json(createErrorResponse('Exercise not found'))
			}

			// If programID is provided, check if program exists
			if (programID) {
				const program = await Program.findByPk(programID)
				if (!program) {
					return res.status(404).json(createErrorResponse('Program not found'))
				}
			}

			await exercise.update({
				name: name || exercise.name,
				difficulty: difficulty || exercise.difficulty,
				programID: programID || exercise.programID
			})

			return res.json(createSuccessResponse('Exercise updated successfully'))
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to update exercise'))
		}
	})

	// Delete exercise
	router.delete('/:id', authenticateJWT, requireAdmin, async (req, res, next: NextFunction) => {
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
	router.post('/:id/program/:programId', authenticateJWT, requireAdmin, async (req, res, next: NextFunction) => {
		try {
			const { id, programId } = req.params

			const exercise = await Exercise.findByPk(id)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('Exercise not found'))
			}

			const program = await Program.findByPk(programId)
			if (!program) {
				return res.status(404).json(createErrorResponse('Program not found'))
			}

			await exercise.update({ programID: programId })

			return res.json(createSuccessResponse('Exercise added to program successfully'))
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to add exercise to program'))
		}
	})

	// Remove exercise from program (actually delete the exercise)
	router.delete('/:id/program', authenticateJWT, requireAdmin, async (req, res, next: NextFunction) => {
		try {
			const { id } = req.params

			const exercise = await Exercise.findByPk(id)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('Exercise not found'))
			}

			// Delete the exercise since it cannot exist without a program
			await exercise.destroy()

			return res.json(createSuccessResponse('Exercise removed from program successfully'))
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to remove exercise from program'))
		}
	})

	return router
}
