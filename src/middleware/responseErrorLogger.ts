import { Request, Response, NextFunction } from 'express'
import { createErrorResponse } from '../types/response/message'
import { Logger } from '../utils/logger'

// Middleware to extend Response with error handling
export const responseErrorLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Add the sendError method directly to the response object
    (res as any).sendError = (translationKey: string, error?: any): Response => {
        const response = createErrorResponse(translationKey, error)

        // Only log errors to console in development mode
        if (process.env.NODE_ENV === 'development') {
            console.error('❗️API Error:', response)
        }

        Logger.logErrorToFile(req, response, error)
        return res.json(response)
    }

    next()
} 