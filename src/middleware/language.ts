import { Request, Response, NextFunction } from 'express'
import i18next from '../i18n'

export interface LanguageRequest extends Request {
    language?: string
}

export const languageMiddleware = (req: LanguageRequest, res: Response, next: NextFunction) => {
    // Get language from header, default to 'en'
    const language = req.headers['accept-language'] as string || 'en'

    // Validate language (only support 'en' and 'sk')
    const supportedLanguages = ['en', 'sk']
    const validLanguage = supportedLanguages.includes(language) ? language : 'en'

    // Set language in request object
    req.language = validLanguage

    // Change i18next language
    i18next.changeLanguage(validLanguage)

    next()
} 