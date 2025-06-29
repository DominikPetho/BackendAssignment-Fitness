import * as fs from 'fs'
import path from 'path'
import { Request } from 'express'

export class Logger {
    private static getLogDir(): string {
        const cwd = process.cwd()
        return path.join(cwd || '/app', 'logs')
    }

    private static getLogFile(): string {
        return path.join(this.getLogDir(), 'error.log')
    }

    /**
     * Sanitize request body to redact sensitive information
     */
    private static sanitizeRequestBody(body: any): any {
        if (!body || typeof body !== 'object') {
            return body
        }

        const sanitized = { ...body }
        const sensitiveFields = ['password', 'confirmPassword', 'currentPassword', 'newPassword']

        // Redact sensitive fields
        sensitiveFields.forEach(field => {
            if (sanitized[field] !== undefined) {
                sanitized[field] = '[REDACTED]'
            }
        })

        return sanitized
    }

    /**
     * Log error to file with request information
     */
    static logErrorToFile(req: Request, response: any, error?: any): void {
        try {
            const timestamp = new Date().toISOString()
            const logDir = this.getLogDir()
            const logFile = this.getLogFile()

            // Create logs directory if it doesn't exist
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true })
            }

            // Prepare log entry with comprehensive path information
            const logEntry = {
                timestamp,
                statusCode: 500,
                method: req.method,
                fullUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
                params: req.params,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                requestBody: this.sanitizeRequestBody(req.body),
                queryParams: req.query,
                response: response,
                error: error ? error.toString() : undefined,
                stack: error?.stack
            }

            // Append to log file
            const logLine = JSON.stringify(logEntry, null, 2) + '\n' + '-'.repeat(80) + '\n'
            fs.appendFileSync(logFile, logLine)

        } catch (logError) {
            // If logging fails, at least log to console
            console.error('Failed to log error to file:', logError)
        }
    }

    /**
     * Get all error logs
     */
    static getErrorLogs(): string {
        try {
            const logFile = this.getLogFile()
            if (!fs.existsSync(logFile)) {
                return 'No error logs found.'
            }
            return fs.readFileSync(logFile, 'utf8')
        } catch (error) {
            return `Error reading logs: ${error}`
        }
    }

    /**
     * Clear all error logs
     */
    static clearErrorLogs(): boolean {
        try {
            const logFile = this.getLogFile()
            if (fs.existsSync(logFile)) {
                fs.unlinkSync(logFile)
            }
            return true
        } catch (error) {
            console.error('Error clearing logs:', error)
            return false
        }
    }
} 