import * as z from 'zod'
import { USER_ROLE } from '../utils/enums'
import { Request, Response, NextFunction } from 'express'

// Password validation with custom error messages
const passwordSchema = z
    .string()
    .refine((password) => {
        const hasMinLength = password.length >= 8
        const hasUppercase = /[A-Z]/.test(password)
        const hasNumber = /[0-9]/.test(password)
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

        return hasMinLength && hasUppercase && hasNumber && hasSpecialChar
    }, {
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character'
    })

// Email validation
const emailSchema = z
    .string()
    .email('Please provide a valid email address')

// Age validation (optional) - handles both string and number inputs
const ageSchema = z
    .union([
        z.string(),
        z.number()
    ])
    .refine((val: any) => {
        const num = typeof val === 'string' ? parseInt(val) : val
        return !isNaN(num) && num >= 1 && num <= 120
    }, {
        message: 'Age must be a valid number between 1 and 120'
    })
    .optional()

// Role validation - required field
const roleSchema = z
    .enum([USER_ROLE.ADMIN, USER_ROLE.USER])

// Registration schema
export const registerSchema = z.object({
    name: z.string().min(1, 'Name must not be empty').optional(),
    surname: z.string().min(1, 'Surname must not be empty').optional(),
    nickName: z.string().min(1, 'Nickname must not be empty').optional(),
    email: emailSchema,
    age: ageSchema,
    password: passwordSchema,
    role: roleSchema
})

// Login schema
export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema
})

// Type inference from schemas
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

// Completed exercise validation schemas
export const completeExerciseSchema = z.object({
    exerciseID: z.number().int().positive('Exercise ID must be a positive integer'),
    programID: z.number().int().positive('Program ID must be a positive integer'),
    duration: z.number().int().min(1, 'Duration must be at least 1 second')
})

export const updateCompletedExerciseSchema = z.object({
    duration: z.number().int().min(1, 'Duration must be at least 1 second')
})

export type CompleteExerciseInput = z.infer<typeof completeExerciseSchema>
export type UpdateCompletedExerciseInput = z.infer<typeof updateCompletedExerciseSchema> 