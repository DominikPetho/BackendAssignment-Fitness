import { Router, Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { authenticateJWT, requireAdmin } from '../middleware/auth'
import { createErrorResponse } from '../types/response/message'
import { validateRequest, updateUserSchema, UpdateUserInput } from '../validation/admin'
import { AuthenticatedRequest } from '../middleware/auth'
import { USER_ROLE } from '../utils/enums'
import { ValidatedRequest } from '../validation/validationInterface'

const router: Router = Router()

const { User } = models

export default () => {
    // Get all users
    router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res) => {
        try {
            const users = await User.findAll({
                attributes: req.user.role === USER_ROLE.ADMIN
                    ? { exclude: ['password'] }
                    : ['id', 'nickName'],
                ...(req.user.role === USER_ROLE.ADMIN && {
                    include: [
                        {
                            model: models.CompletedExercise,
                            as: 'completedExercises',
                            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
                            include: [{
                                model: models.Exercise,
                                as: 'exercise',
                                attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
                            }]
                        }
                    ]
                })
            })

            return res.json(users)
        } catch (error) {
            return res.status(500).sendError('user.fetchFailed')
        }
    })

    // Get user detail by ID (ADMIN only)
    router.get('/:id', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res) => {
        try {
            const { id } = req.params

            const user = await User.findByPk(id, {
                attributes: { exclude: ['password'] },
                include: [
                    {
                        model: models.CompletedExercise,
                        as: 'completedExercises',
                        attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
                        include: [{
                            model: models.Exercise,
                            as: 'exercise',
                            attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
                        }]
                    }
                ]
            })

            if (!user) {
                return res.status(404).sendError('user.notFound')
            }

            return res.json(user)
        } catch (error) {
            return res.status(500).sendError('user.fetchDetailsFailed')
        }
    })

    // Update user (ADMIN only)
    router.patch('/:id', authenticateJWT, requireAdmin, validateRequest(updateUserSchema), async (req: ValidatedRequest<UpdateUserInput>, res) => {
        try {
            const { id } = req.params
            const { name, surname, nickName, age, role } = req.validatedBody

            const user = await User.findByPk(id)
            if (!user) {
                return res.status(404).sendError('user.notFound')
            }

            // Check if nickName is being updated and if it's already taken by another user
            if (nickName && nickName !== user.nickName) {
                const existingUser = await User.findOne({
                    where: { nickName }
                })
                if (existingUser) {
                    return res.status(409).sendError('user.nicknameExists')
                }
            }

            // Update user with provided fields
            const updateData: any = {}
            if (name !== undefined) updateData.name = name
            if (surname !== undefined) updateData.surname = surname
            if (nickName !== undefined) updateData.nickName = nickName
            if (age !== undefined) updateData.age = age
            if (role !== undefined) updateData.role = role

            const value = await user.update(updateData)

            // Return updated user without password
            const updatedUser = await User.findByPk(id, {
                attributes: { exclude: ['password'] }
            })

            return res.json(updatedUser)
        } catch (error) {
            return res.status(500).sendError('user.updateFailed')
        }
    })

    return router
} 