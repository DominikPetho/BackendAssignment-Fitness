import * as z from 'zod'
import { USER_ROLE, EXERCISE_DIFFICULTY } from '../utils/enums'
import { Request, Response, NextFunction } from 'express'

// Exercise validation schemas
export const createExerciseSchema = z.object({
    name: z.string().min(1, 'Exercise name is required').max(200, 'Exercise name must be less than 200 characters'),
    difficulty: z.enum([EXERCISE_DIFFICULTY.EASY, EXERCISE_DIFFICULTY.MEDIUM, EXERCISE_DIFFICULTY.HARD]),
    programID: z.number().int().positive('Program ID must be a positive integer').optional()
})

export const updateExerciseSchema = z.object({
    name: z.string().min(1, 'Exercise name is required').max(200, 'Exercise name must be less than 200 characters').optional(),
    difficulty: z.enum([EXERCISE_DIFFICULTY.EASY, EXERCISE_DIFFICULTY.MEDIUM, EXERCISE_DIFFICULTY.HARD]).optional()
})

// Exercise completion tracking schemas
export const completeExerciseSchema = z.object({
    exerciseID: z.number().int().positive('Exercise ID must be a positive integer'),
    duration: z.number().int().min(1, 'Duration must be at least 1 second')
})

export const updateExerciseCompletionSchema = z.object({
    completedAt: z.date().optional(),
    duration: z.number().int().min(1, 'Duration must be at least 1 second').optional()
})

// User validation schemas
export const updateUserSchema = z.object({
    name: z.string().min(1, 'Name must not be empty').max(100, 'Name must be less than 100 characters').optional(),
    surname: z.string().min(1, 'Surname must not be empty').max(100, 'Surname must be less than 100 characters').optional(),
    nickName: z.string().min(1, 'Nickname must not be empty').max(50, 'Nickname must be less than 50 characters').optional(),
    age: z.number().int().min(1, 'Age must be at least 1').max(120, 'Age must be at most 120').optional(),
    role: z.enum([USER_ROLE.ADMIN, USER_ROLE.USER]).optional()
})

// Type inference from schemas
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>
export type CompleteExerciseInput = z.infer<typeof completeExerciseSchema>
export type UpdateExerciseCompletionInput = z.infer<typeof updateExerciseCompletionSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>