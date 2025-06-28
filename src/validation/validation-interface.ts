import { Request } from 'express'

export interface ValidatedRequest<T> extends Request {
    validatedBody: T
}