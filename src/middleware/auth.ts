import passport from 'passport'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { Strategy as LocalStrategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { models } from '../db'
import { USER_ROLE } from '../utils/enums'
import { createErrorResponse } from '../types/response/message'
import { UserModel } from '../db/user'

const { User } = models

// Custom interface for authenticated requests
export interface AuthenticatedRequest extends Request {
    user?: UserModel
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '24h'

// Configure JWT Strategy
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
}, async (payload: any, done: any) => {
    try {
        const user = await User.findByPk(payload.id) as UserModel | null
        if (user) {
            return done(null, user)
        }
        return done(null, false)
    } catch (error) {
        return done(error, false)
    }
}))

// Configure Local Strategy for login with proper typing
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email: string, password: string, done: (error: any, user?: UserModel | false, info?: { message: string }) => void) => {
    try {
        // Use proper Sequelize syntax
        const user = await User.findOne({
            where: {
                email: email
            }
        }) as UserModel | null

        if (!user) {
            return done(null, false, { message: 'auth.invalidEmailOrPassword' })
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password)
        if (!isValidPassword) {
            return done(null, false, { message: 'auth.invalidEmailOrPassword' })
        }

        return done(null, user)
    } catch (error) {
        return done(error)
    }
}))

// Generate JWT Token
export const generateToken = (user: UserModel): string => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    )
}

// Authentication middleware
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: UserModel | false) => {
        if (err) {
            return res.status(500).json(createErrorResponse('auth.authenticationError'))
        }
        if (!user) {
            return res.status(401).json(createErrorResponse('auth.unauthorizedAccess'))
        }
        req.user = user
        next()
    })(req, res, next)
}

// Role-based authorization middleware with proper typing
export const requireRole = (roles: USER_ROLE[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json(createErrorResponse('auth.authenticationRequired'))
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json(createErrorResponse('auth.insufficientPermissions'))
        }

        next()
    }
}

// Admin-only middleware
export const requireAdmin = requireRole([USER_ROLE.ADMIN])

export default passport 