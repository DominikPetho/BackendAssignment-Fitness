import { Router, Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { authenticateJWT, requireAdmin } from '../middleware/auth'
import { createErrorResponse, createSuccessResponse } from '../types/response/message'
import { validateRequest, createExerciseSchema, updateExerciseSchema, CreateExerciseInput, UpdateExerciseInput } from '../validation/admin'
import { ValidatedRequest } from '../validation/validation-interface'

const router: Router = Router()

const {
	Exercise,
	Program,
	User
} = models

export default () => {
	// Public route - get all exercises
	router.get('/', async (_, res) => {
		const exercises = await Exercise.findAll({
			include: [{
				model: Program,
				as: 'program',
				attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
			}],
			attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
		})

		if (exercises.length === 0) {
			return res.json(createErrorResponse('No exercises found'))
		} else {
			return res.json({ exercises })
		}
	})

	// ADMIN ONLY ROUTES

	// Create exercise
	router.post('/', authenticateJWT, requireAdmin, validateRequest(createExerciseSchema), async (req: ValidatedRequest<CreateExerciseInput>, res) => {
		try {
			const { name, difficulty, programID } = req.validatedBody

			// Check if program exists
			const program = await Program.findByPk(programID)
			if (!program) {
				return res.status(404).json(createErrorResponse('Program not found'))
			}

			const exercise = await Exercise.create({
				name,
				difficulty,
				programID
			})

			return res.status(201).json({
				data: exercise,
				message: 'Exercise created successfully'
			})
		} catch (error) {
			return res.status(500).json(createErrorResponse('Failed to create exercise'))
		}
	})

	// Update exercise
	router.patch('/:id', authenticateJWT, requireAdmin, validateRequest(updateExerciseSchema), async (req: ValidatedRequest<UpdateExerciseInput>, res) => {
		try {
			const { id } = req.params
			const { name, difficulty, programID } = req.validatedBody

			const exercise = await Exercise.findByPk(id)
			if (!exercise) {
				return res.status(404).json(createErrorResponse('Exercise not found'))
			}

			// Check if program exists if programID is being updated
			if (programID) {
				const program = await Program.findByPk(programID)
				if (!program) {
					return res.status(404).json(createErrorResponse('Program not found'))
				}
			}

			await exercise.update({
				name,
				difficulty,
				programID
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
	router.post('/:id/program/:programId', authenticateJWT, requireAdmin, async (req, res) => {
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
	router.delete('/:id/program', authenticateJWT, requireAdmin, async (req, res) => {
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
