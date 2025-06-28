import { Router, Request, Response, NextFunction } from 'express'
import passport from 'passport'
import { models } from '../db'
import { generateToken } from '../middleware/auth'
import { validateRequest, registerSchema, loginSchema, RegisterInput, LoginInput } from '../validation/auth'
import { createErrorResponse } from '../types/response/message'
import { createAuthSuccessResponse } from '../types/response/auth'

const router: Router = Router()
const { User } = models

// Custom interface for requests with validated body
interface ValidatedRequest<T> extends Request {
    validatedBody: T
}

export default () => {
    // User Registration with Zod validation
    router.post('/register', validateRequest(registerSchema), async (req: ValidatedRequest<RegisterInput>, res: Response, next: NextFunction) => {
        try {
            const { name, surname, nickName, email, age, password, role } = req.validatedBody

            // Check if user already exists
            const existingUser = await User.findOne({
                where: {
                    $or: [
                        { email }
                    ]
                }
            })

            if (existingUser) {
                return res.status(409).json(createErrorResponse('User with this email already exists'))
            }

            // Create new user with validated data
            const userData: any = {
                email,
                password,
                role
            }

            // Add optional fields if provided
            if (name) userData.name = name
            if (surname) userData.surname = surname
            if (nickName) userData.nickName = nickName
            if (age !== undefined) userData.age = age

            const user = await User.create(userData)

            // Generate token
            const token = generateToken(user)

            // Return success response with user and token
            return res.status(201).json(createAuthSuccessResponse(user, token))
        } catch (error) {
            return res.status(500).json(createErrorResponse('Registration failed'))
        }
    })

    router.post('/login', validateRequest(loginSchema), (req: ValidatedRequest<LoginInput>, res: Response, next: NextFunction) => {
        passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
            if (err) {
                return res.status(500).json(createErrorResponse('Login failed'))
            }

            if (!user) {
                return res.status(401).json(createErrorResponse(info?.message || 'Invalid credentials'))
            }

            const token = generateToken(user)

            // Return success response with user and token
            return res.json(createAuthSuccessResponse(user, token))
        })(req, res, next)
    })

    return router
} 