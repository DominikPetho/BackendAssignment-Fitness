import i18next from '../../i18n'

// Message types enum
export enum MessageType {
    ERROR = 'ERROR',
    SUCCESS = 'SUCCESS'
}

// Response message object for failed responses
export interface ResponseMessage {
    message: string
    type: MessageType
}

// Helper functions to create response messages
export const createErrorResponse = (translationKey: string): ResponseMessage => ({
    message: i18next.t(translationKey),
    type: MessageType.ERROR
})

export const createSuccessResponse = (translationKey: string): ResponseMessage => ({
    message: i18next.t(translationKey),
    type: MessageType.SUCCESS
}) 