// Message types enum
export enum MessageType {
    ERROR = 'ERROR',
    INFO = 'INFO',
    WARNING = 'WARNING',
    SUCCESS = 'SUCCESS'
}

// Response message object for failed responses
export interface ResponseMessage {
    message: string
    type: MessageType
}

// Helper functions to create response messages
export const createErrorResponse = (message: string): ResponseMessage => ({
    message,
    type: MessageType.ERROR
})

export const createInfoResponse = (message: string): ResponseMessage => ({
    message,
    type: MessageType.INFO
})

export const createWarningResponse = (message: string): ResponseMessage => ({
    message,
    type: MessageType.WARNING
})

export const createSuccessResponse = (message: string): ResponseMessage => ({
    message,
    type: MessageType.SUCCESS
}) 