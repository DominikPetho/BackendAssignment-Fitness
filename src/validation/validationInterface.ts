import { Request } from 'express'
import * as z from 'zod'

export interface ValidatedRequest<T> extends Request {
    validatedBody: T
}

// Validation middleware helper
export const validateRequest = <T>(schema: z.ZodSchema<T>) => {
    return (req: any, res: any, next: any) => {
        try {
            const validatedData = schema.parse(req.body)
            req.validatedBody = validatedData
            next()
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.errors.map((err: any) => {
                    const path = err.path.join('.')
                    return `${path}: ${err.message}`
                }).join(', ')

                if (errorMessage) {
                    return res.status(400).sendError("validation.failed", errorMessage)
                }
                return res.status(400).sendError('validation.failed')
            }
            return res.status(400).sendError('validation.failed')
        }
    }
}
