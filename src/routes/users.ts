import { Router, Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { authenticateJWT, requireAdmin } from '../middleware/auth'
import { createErrorResponse } from '../types/response/message'
import { validateRequest, updateUserSchema, UpdateUserInput } from '../validation/admin'

const router: Router = Router()

const { User } = models

// Custom interface for authenticated requests
interface AuthenticatedRequest extends Request {
    user?: any
}

// Custom interface for requests with validated body
interface ValidatedRequest<T> extends Request {
    validatedBody: T
}

export default () => {
    // Get all users (ADMIN only)
    router.get('/', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password'] } // Don't return passwords
            })

            return res.json({
                data: users,
                message: 'List of all users'
            })
        } catch (error) {
            return res.status(500).json(createErrorResponse('Failed to fetch users'))
        }
    })

    // Get user detail by ID (ADMIN only)
    router.get('/:id', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params

            const user = await User.findByPk(id, {
                attributes: { exclude: ['password'] } // Don't return password
            })

            if (!user) {
                return res.status(404).json(createErrorResponse('User not found'))
            }

            return res.json({
                data: user,
                message: 'User details retrieved successfully'
            })
        } catch (error) {
            return res.status(500).json(createErrorResponse('Failed to fetch user details'))
        }
    })

    // Update user (ADMIN only)
    router.put('/:id', authenticateJWT, requireAdmin, validateRequest(updateUserSchema), async (req: ValidatedRequest<UpdateUserInput>, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params
            const { name, surname, nickName, age, email, role } = req.validatedBody

            const user = await User.findByPk(id)
            if (!user) {
                return res.status(404).json(createErrorResponse('User not found'))
            }

            // Check if email is being updated and if it's already taken by another user
            if (email && email !== user.email) {
                const existingUser = await User.findOne({
                    where: { email }
                })
                if (existingUser) {
                    return res.status(409).json(createErrorResponse('Email already exists'))
                }
            }

            // Check if nickName is being updated and if it's already taken by another user
            if (nickName && nickName !== user.nickName) {
                const existingUser = await User.findOne({
                    where: { nickName }
                })
                if (existingUser) {
                    return res.status(409).json(createErrorResponse('Nickname already exists'))
                }
            }

            // Update user with provided fields
            const updateData: any = {}
            if (name !== undefined) updateData.name = name
            if (surname !== undefined) updateData.surname = surname
            if (nickName !== undefined) updateData.nickName = nickName
            if (age !== undefined) updateData.age = age
            if (email !== undefined) updateData.email = email
            if (role !== undefined) updateData.role = role

            await user.update(updateData)

            // Return updated user without password
            const updatedUser = await User.findByPk(id, {
                attributes: { exclude: ['password'] }
            })

            return res.json({
                data: updatedUser,
                message: 'User updated successfully'
            })
        } catch (error) {
            return res.status(500).json(createErrorResponse('Failed to update user'))
        }
    })

    return router
} 