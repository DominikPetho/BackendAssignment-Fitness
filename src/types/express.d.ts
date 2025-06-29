import { Response } from 'express'

declare global {
    namespace Express {
        interface Response {
            sendError(translationKey: string, error?: any): Response
        }
    }
}

export { } 