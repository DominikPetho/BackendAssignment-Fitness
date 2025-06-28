/* eslint import/no-cycle: 0 */

import {
    Sequelize,
    DataTypes,
    Model
} from 'sequelize'
import bcrypt from 'bcryptjs'
import { DatabaseModel } from '../types/db'
import { USER_ROLE } from '../utils/enums'
import { CompletedExerciseModel } from './completedExercise'

// Password hashing configuration
const SALT_ROUNDS = 10

export class UserModel extends DatabaseModel {
    id: number
    name?: string
    surname?: string
    nickName?: string
    email: string
    age?: number
    role: USER_ROLE
    password: string

    completedExercises: CompletedExerciseModel[]

    // Instance methods
    async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password)
    }
}

export default (sequelize: Sequelize) => {
    UserModel.init({
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        surname: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        nickName: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        age: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 120
            }
        },
        role: {
            type: DataTypes.ENUM(...Object.values(USER_ROLE)),
            allowNull: false,
            defaultValue: USER_ROLE.USER
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        paranoid: true,
        timestamps: true,
        sequelize,
        modelName: 'user',
        hooks: {
            beforeCreate: async (instance: UserModel) => {
                if (instance.changed('password')) {
                    instance.password = await bcrypt.hash(instance.password, SALT_ROUNDS)
                }
            },
            beforeUpdate: async (instance: UserModel) => {
                if (instance.changed('password')) {
                    instance.password = await bcrypt.hash(instance.password, SALT_ROUNDS)
                }
            }
        },
        indexes: [
            {
                unique: true,
                fields: ['email']
            }
        ]
    })

    UserModel.associate = (models) => {
        (UserModel as any).hasMany(models.CompletedExercise, {
            foreignKey: {
                name: 'userID',
                allowNull: false
            },
            as: 'completedExercises'
        })
    }

    return UserModel
} 