import { Router, Request, Response, NextFunction } from 'express'
import passport from 'passport'
import { models } from '../db'
import { generateToken } from '../middleware/auth'
import { validateRequest, registerSchema, loginSchema, RegisterInput, LoginInput } from '../validation/auth'
import { createErrorResponse } from '../types/response/message'
import { createAuthSuccessResponse } from '../types/response/auth'
import { ValidatedRequest } from '../validation/validation-interface'
import { Op } from 'sequelize'

const router: Router = Router()
const { User } = models

export default () => {
    // User Registration with Zod validation
    router.post('/register', validateRequest(registerSchema), async (req: ValidatedRequest<RegisterInput>, res) => {
        try {
            const { name, surname, nickName, email, age, password, role } = req.validatedBody

            // Check if user already exists with same email or nickname
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [
                        { email },
                        ...(nickName ? [{ nickName }] : [])
                    ]
                }
            })

            if (existingUser) {
                if (existingUser.email === email) {
                    return res.status(409).json(createErrorResponse('user.emailExists'))
                }
                if (existingUser.nickName === nickName) {
                    return res.status(409).json(createErrorResponse('user.nicknameExists'))
                }
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
            return res.status(500).json(createErrorResponse('auth.registrationFailed'))
        }
    })

    router.post('/login', validateRequest(loginSchema), (req: ValidatedRequest<LoginInput>, res, next) => {
        passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
            if (err) {
                return res.status(500).json(createErrorResponse('auth.loginFailed'))
            }

            if (!user) {
                // Use the translation key from the passport strategy
                const errorKey = info?.message || 'auth.invalidCredentials'
                return res.status(401).json(createErrorResponse(errorKey))
            }

            const token = generateToken(user)

            // Return success response with user and token
            return res.json(createAuthSuccessResponse(user, token))
        })(req, res, next)
    })

    return router
} 