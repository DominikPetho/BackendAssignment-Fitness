import { UserModel } from '../../db/user'

// Success response object for login and registration
export interface AuthSuccessResponse {
    user: {
        id: number
        name?: string
        surname?: string
        nickName?: string
        email: string
        age?: number
        role: string
    }
    token: string
}

// Helper function to create auth success response
export const createAuthSuccessResponse = (user: UserModel, token: string): AuthSuccessResponse => ({
    user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        nickName: user.nickName,
        email: user.email,
        age: user.age,
        role: user.role
    },
    token
}) 