/* eslint import/no-cycle: 0 */

import {
    Sequelize,
    DataTypes,
    Model
} from 'sequelize'
import { DatabaseModel } from '../types/db'
import { UserModel } from './user'
import { ExerciseModel } from './exercise'

export class CompletedExerciseModel extends DatabaseModel {
    id: number
    userID: number
    exerciseID: number
    completedAt: Date
    duration: number

    user: UserModel
    exercise: ExerciseModel
}

export default (sequelize: Sequelize) => {
    CompletedExerciseModel.init({
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        userID: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        exerciseID: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'exercises',
                key: 'id'
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            }
        }
    }, {
        timestamps: true,
        sequelize,
        modelName: 'completedExercise',
        indexes: [
            {
                fields: ['userID']
            },
            {
                fields: ['exerciseID']
            }
        ]
    })

    CompletedExerciseModel.associate = (models) => {
        (CompletedExerciseModel as any).belongsTo(models.User, {
            foreignKey: {
                name: 'userID',
                allowNull: false
            },
            as: 'user'
        }),

            (CompletedExerciseModel as any).belongsTo(models.Exercise, {
                foreignKey: {
                    name: 'exerciseID',
                    allowNull: false
                },
                as: 'exercise'
            })
    }

    return CompletedExerciseModel
} 