import express from 'express'
import { Op } from 'sequelize'
import { authenticateJWT } from '../middleware/auth'
import { validateRequest } from '../validation/admin'
import { completeExerciseSchema, updateCompletedExerciseSchema } from '../validation/auth'
import { ValidatedRequest } from '../validation/validationInterface'
import { CompleteExerciseInput, UpdateCompletedExerciseInput } from '../validation/auth'
import { createSuccessResponse } from '../types/response/message'
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
                return res.status(404).sendError('user.notFound')
            }

            return res.json(user)
        } catch (error) {
            return res.status(500).sendError('user.profileFetchFailed')
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
                    return res.status(404).sendError('exercise.notFound')
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
                return res.status(500).sendError('completedExercise.completeFailed')
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
            return res.status(500).sendError('completedExercise.fetchFailed')
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
                return res.status(404).sendError('completedExercise.notFound')
            }

            await completedExercise.destroy()

            return res.json(createSuccessResponse('completedExercise.removed'))
        } catch (error) {
            return res.status(500).sendError('completedExercise.removeFailed')
        }
    })

    return router
}