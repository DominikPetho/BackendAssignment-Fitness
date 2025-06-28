import express from 'express'
import { Op } from 'sequelize'
import { authenticateJWT } from '../middleware/auth'
import { validateRequest } from '../validation/admin'
import { completeExerciseSchema, updateCompletedExerciseSchema } from '../validation/auth'
import { ValidatedRequest } from '../validation/validation-interface'
import { CompleteExerciseInput, UpdateCompletedExerciseInput } from '../validation/auth'
import { createErrorResponse } from '../types/response/message'
import { models } from '../db'
import { AuthenticatedRequest } from '../middleware/auth'
import { UserModel } from '../db/user'

const router = express.Router()
const { User, Exercise, CompletedExercise } = models

export default () => {
    router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res) => {
        try {
            const userId = req.user.id
            const user = await User.findByPk(userId, {
                attributes: { exclude: ['password'] }
            })

            if (!user) {
                return res.status(404).json(createErrorResponse('User not found'))
            }

            return res.json(user)
        } catch (error) {
            return res.status(500).json(createErrorResponse('Failed to retrieve profile'))
        }
    })

    // Track completed exercise
    router.post(
        '/complete-exercise',
        authenticateJWT,
        validateRequest(completeExerciseSchema),
        async (req: ValidatedRequest<CompleteExerciseInput>, res) => {
            try {
                const userId = (req.user as UserModel).id
                const { exerciseID, duration } = req.validatedBody

                // Check if exercise exists
                const exercise = await Exercise.findByPk(exerciseID)
                if (!exercise) {
                    return res.status(404).json(createErrorResponse('Exercise not found'))
                }

                // Create a new completed exercise record
                const completedExercise = await CompletedExercise.create({
                    userID: userId,
                    exerciseID,
                    completedAt: new Date(),
                    duration
                })

                return res.status(201).json(completedExercise)
            } catch (error) {
                return res.status(500).json(createErrorResponse('Failed to complete exercise'))
            }
        })

    // List completed exercises
    router.get('/completed-exercises', authenticateJWT, async (req, res) => {
        try {
            const userId = (req.user as UserModel).id

            const completedExercises = await CompletedExercise.findAll({
                where: { userID: userId },
                include: [
                    {
                        model: Exercise,
                        as: 'exercise',
                        attributes: ['id', 'name', 'difficulty']
                    }
                ],
                order: [['completedAt', 'DESC']]
            })

            return res.json(completedExercises)
        } catch (error) {
            return res.status(500).json(createErrorResponse('Failed to retrieve completed exercises'))
        }
    })

    // Remove tracked exercise
    router.delete('/completed-exercises/:id', authenticateJWT, async (req: AuthenticatedRequest, res) => {
        try {
            const userId = req.user.id
            const { id } = req.params

            const completedExercise = await CompletedExercise.findOne({
                where: { id, userID: userId }
            })

            if (!completedExercise) {
                return res.status(404).json(createErrorResponse('Completed exercise not found'))
            }

            await completedExercise.destroy()

            return res.json({
                message: 'Completed exercise removed successfully'
            })
        } catch (error) {
            return res.status(500).json(createErrorResponse('Failed to remove completed exercise'))
        }
    })

    return router
}